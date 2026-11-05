import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Alert } from '@/lib/alert';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { categories, formatPrice, getProvider, getService } from '@/constants/marketplace';
import { ActionButton, HeartButton, IconButton, Page, ServiceImage, uiStyles } from '@/components/MarketplaceUI';

export default function ServiceDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { favorites, toggleFavorite, addRequest, hydrated, customServices } = useMarketplace();
  // customServices is read so this screen re-renders when the shared list refreshes.
  void customServices;
  const service = getService(id);
  const [area, setArea] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Fall back to the home tab when there is nothing to go back to (e.g. page reloaded on web).
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shop');
  };

  if (!service) {
    return (
      <Page>
        <View style={styles.missing}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          {!hydrated ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Service not found</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>It may have been removed by the provider.</Text>
              <ActionButton label="Browse services" onPress={() => router.replace('/(tabs)/explore')} />
            </>
          )}
        </View>
      </Page>
    );
  }

  const category = categories.find((item) => item.id === service.category);
  const provider = getProvider(service.provider);
  const paused = service.active === false;
  const chosenArea = area ?? (service.serviceAreas.length === 1 ? service.serviceAreas[0] : null);

  async function addToRequests() {
    if (!service || adding) return;
    if (!chosenArea) {
      Alert.alert('Choose an area', 'Pick the barangay or town where you need this service.');
      return;
    }
    setAdding(true);
    try {
      await addRequest(service.id, chosenArea);
      router.replace({ pathname: '/(tabs)/shop', params: { added: service.title, t: String(Date.now()) } });
    } catch (error) {
      Alert.alert('Could not add request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 12, paddingBottom: 30 }]}>
        <View style={styles.topBar}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          <HeartButton favorite={favorites.includes(service.id)} onPress={() => toggleFavorite(service.id)} inactiveColor={colors.mutedForeground} />
        </View>

        <ServiceImage service={service} style={styles.hero} />

        <View style={styles.header}>
          {category ? (
            <View style={[styles.categoryPill, { backgroundColor: colors.accent }]}>
              <Feather name={category.icon as React.ComponentProps<typeof Feather>['name']} size={12} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '700' }}>{category.title}</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>{service.title}</Text>
          {service.subtitle && service.subtitle !== service.title ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{service.subtitle}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>From {formatPrice(service.price)}</Text>
            <View style={styles.rating}>
              <Feather name="star" size={14} color="#F3A64C" />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>
                {service.reviews > 0 ? `${service.rating.toFixed(1)} (${service.reviews})` : 'New'}
              </Text>
            </View>
          </View>
        </View>

        {paused ? (
          <View style={[styles.notice, { backgroundColor: colors.accent }]}>
            <Feather name="pause-circle" size={16} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', flex: 1 }}>This service is paused, so customers can&apos;t see it right now.</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${service.provider}`}
          onPress={() => provider && router.push({ pathname: '/provider/[id]', params: { id: provider.id } })}
          style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.providerIcon, { backgroundColor: colors.accent }]}>
            <Feather name={(provider?.icon ?? 'briefcase') as React.ComponentProps<typeof Feather>['name']} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>PROVIDER</Text>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginTop: 2 }}>{service.provider}</Text>
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>Available near {service.area}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Where do you need it?</Text>
          <View style={styles.chips}>
            {service.serviceAreas.map((item) => {
              const selected = chosenArea === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setArea(item)}
                  style={[styles.chip, { backgroundColor: selected ? colors.navy : colors.accent }]}
                >
                  <Feather name="map-pin" size={11} color={selected ? '#FFFFFF' : colors.primary} />
                  <Text style={{ color: selected ? '#FFFFFF' : colors.foreground, fontSize: 11, fontWeight: '600' }}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <ActionButton
            label={adding ? 'Adding…' : 'Add to requests'}
            icon="plus"
            disabled={adding || paused}
            onPress={() => void addToRequests()}
          />
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, padding: 22, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hero: { width: '100%', aspectRatio: 4 / 3, borderRadius: 22, overflow: 'hidden' },
  header: { marginTop: 16, gap: 6 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 14, marginTop: 14 },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 18 },
  providerIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 22, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
});