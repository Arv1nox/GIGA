import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { getProviderById, getProviderLocations, getProviderServices, getProviderStats } from '@/constants/marketplace';
import { IconButton, Page, ServiceRow, uiStyles } from '@/components/MarketplaceUI';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export default function ProviderProfileScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { favorites, toggleFavorite } = useMarketplace();
  const provider = getProviderById(id);

  // Fall back to the home tab when there is nothing to go back to (e.g. page reloaded on web).
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/shop');
  };

  if (!provider) {
    return (
      <Page>
        <View style={styles.missing}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Provider not found</Text>
        </View>
      </Page>
    );
  }

  const stats = getProviderStats(provider.name);
  const offered = getProviderServices(provider.name);
  const locations = getProviderLocations(provider.name);

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 12, paddingBottom: 30 }]}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />

        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Feather name={provider.icon as FeatherName} size={36} color={colors.primary} />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{provider.name}</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{provider.tagline}</Text>
          <View style={styles.pills}>
            <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="star" size={13} color="#F3A64C" />
              <Text style={[styles.pillText, { color: colors.foreground }]}>{stats.rating.toFixed(1)} ({stats.reviews} reviews)</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={13} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.foreground }]}>Based in {provider.area}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{provider.yearsActive}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Years active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.services}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stats.services === 1 ? 'Service' : 'Services'}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{provider.responseTime.replace('Within ', '')}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Typical reply</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{provider.about}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Locations</Text>
          <View style={styles.chips}>
            {locations.map((location) => (
              <View key={location} style={[styles.chip, { backgroundColor: colors.accent }]}>
                <Feather name="map-pin" size={11} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '600' }}>{location}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{stats.services === 1 ? 'Service offered' : 'Services offered'}</Text>
          <View style={{ gap: 11 }}>
            {offered.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                favorite={favorites.includes(service.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </View>
        </View>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>Sample provider profile for this preview.</Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, padding: 22, gap: 18 },
  header: { alignItems: 'center', gap: 6, marginTop: 4 },
  avatar: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  tagline: { fontSize: 13, textAlign: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 14, marginTop: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 28 },
  section: { marginTop: 22, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  note: { fontSize: 10, textAlign: 'center', marginTop: 22 },
});