import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';

const suggestions = [
  'Bagumbayan Sur, Naga City',
  'Concepcion Pequeña, Naga City',
  'San Felipe, Naga City',
  'Pili, Camarines Sur',
];

export default function LocationScreen() {
  const colors = useColors();
  const { location, setLocation } = useMarketplace();
  const [selected, setSelected] = useState(location);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  async function useCurrentLocation() {
    setLoading(true);
    try {
      let latitude: number;
      let longitude: number;
      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Location is not available in this browser.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          const result = await Location.requestForegroundPermissionsAsync();
          if (!result.granted) {
            if (!result.canAskAgain) {
              Alert.alert('Location access is off', 'Choose an address below or enable location in Settings.', [
                { text: 'Choose address', style: 'cancel' },
                { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
              ]);
            } else {
              Alert.alert('Location permission needed', 'Choose an address below or allow location access to use your current area.');
            }
            return;
          }
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
      let address = `Current location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
      if (Platform.OS !== 'web') {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        address = [place?.district || place?.subregion, place?.city, place?.region].filter(Boolean).join(', ') || address;
      }
      if (address) { setSelected(address); setCustom(''); }
      else Alert.alert('Location found', 'Choose the matching service area from the list below.');
    } catch {
      Alert.alert("Couldn't get your location", 'You can still choose your neighborhood from the list.');
    } finally {
      setLoading(false);
    }
  }

  function onCustomChange(text: string) {
    setCustom(text);
    // Typing an address makes it the selected one; clearing it falls back to the saved location.
    setSelected(text.trim() ? text : location);
  }

  function pickSuggestion(address: string) {
    setCustom('');
    setSelected(address);
  }

  function saveLocation() {
    const finalLocation = (custom.trim() || selected).trim();
    if (!finalLocation) {
      Alert.alert('Enter a location', 'Type your address or choose one from the list.');
      return;
    }
    setLocation(finalLocation);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shop');
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={[styles.mapCard, { backgroundColor: colors.accent }]}>
          <View style={[styles.mapStrip, { backgroundColor: colors.categoryGreen }]} />
          <View style={[styles.mapRoad, { backgroundColor: colors.card }]} />
          <View style={[styles.pin, { backgroundColor: colors.primary }]}>
            <Feather name="map-pin" size={30} color="#FFFFFF" />
          </View>
          <View style={[styles.mapLabel, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 11 }}>Your service area</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Select your location</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          We'll show reliable home services near your neighborhood.
        </Text>
        <Pressable onPress={useCurrentLocation} style={[styles.currentLocation, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={[styles.locationIcon, { backgroundColor: colors.accent }]}><Feather name="crosshair" size={18} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{loading ? 'Finding your location…' : 'Use my current location'}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>Your location stays on this device</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>OR TYPE YOUR ADDRESS</Text>
        <FormField
          label="Your address"
          value={custom}
          onChangeText={onCustomChange}
          placeholder="Street, barangay, city"
          autoCapitalize="words"
          accessibilityLabel="Type your address"
        />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>POPULAR NEARBY</Text>
        <View style={[styles.list, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {suggestions.map((address, index) => (
            <Pressable
              key={address}
              onPress={() => pickSuggestion(address)}
              style={[styles.address, index < suggestions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <Feather name="map-pin" size={16} color={selected === address ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.addressText, { color: colors.foreground, fontWeight: selected === address ? '700' : '500' }]}>{address}</Text>
              {selected === address ? <Feather name="check" size={17} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </View>
        <ActionButton label="Set this location" onPress={saveLocation} icon="arrow-right" />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 21, paddingTop: 9, paddingBottom: 22, gap: 14 },
  mapCard: { height: 168, borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  mapStrip: { position: 'absolute', width: 250, height: 26, borderRadius: 20, transform: [{ rotate: '-20deg' }] },
  mapRoad: { position: 'absolute', width: 330, height: 16, borderRadius: 20, transform: [{ rotate: '30deg' }] },
  pin: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  mapLabel: { position: 'absolute', bottom: 13, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  title: { fontSize: 22, textAlign: 'center', fontWeight: '800', marginTop: 3 },
  copy: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 22, marginTop: -7, marginBottom: 3 },
  currentLocation: { minHeight: 67, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 11 },
  locationIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 3 },
  list: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  address: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13 },
  addressText: { flex: 1, fontSize: 12 },
});