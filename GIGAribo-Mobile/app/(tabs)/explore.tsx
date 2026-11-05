import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { categories } from '@/constants/marketplace';

import { CategoryTile, EmptyState, IconButton, Page, SearchField, ServiceCard, ServiceRow, SectionHeading, uiStyles } from '@/components/MarketplaceUI';

export default function ExploreScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(params.category ?? '');
  const { favorites, toggleFavorite, location, allServices, customServices, refreshServices } = useMarketplace();

  // Tabs stay mounted, so follow the category from Shop each time it changes (and clear it when none is passed).
  useEffect(() => {
    setSelected(params.category ?? '');
  }, [params.category]);

  // Pull the latest provider services whenever this tab comes into view.
  // (refreshServices changes whenever the marketplace state does, so keep it in a ref to avoid a refresh loop.)
  const refreshRef = useRef(refreshServices);
  refreshRef.current = refreshServices;
  useFocusEffect(useCallback(() => {
    void refreshRef.current();
  }, []));
  const visible = useMemo(() => allServices.filter((service) => {
    const matchesQuery = `${service.title} ${service.subtitle} ${service.provider}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (!selected || service.category === selected);
  }), [allServices, query, selected]);

  // Services providers added in the app, newest first (paused ones are hidden). Shown on top so they are easy to find.
  const newFromProviders = useMemo(() => customServices.filter((service) => {
    if (service.active === false) return false;
    return `${service.title} ${service.subtitle} ${service.provider}`.toLowerCase().includes(query.toLowerCase());
  }), [customServices, query]);

  return (
    <Page tabbed>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 10, paddingBottom: 104 }]}>
        <View style={styles.heading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR LOCAL DIRECTORY</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Find services</Text>
          </View>
          <IconButton icon="sliders" accessibilityLabel="Clear filters" onPress={() => { setQuery(''); setSelected(''); }} />
        </View>
        <SearchField value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder="What does your home need?" />
        <View style={styles.section}>
          <SectionHeading title="Categories" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 18 }}>
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                selected={selected === category.id}
                onPress={() => setSelected(selected === category.id ? '' : category.id)}
              />
            ))}
          </ScrollView>
        </View>
        {newFromProviders.length > 0 ? (
          <View style={styles.newSection}>
            <SectionHeading title="New from local providers" />
            <View style={{ gap: 12 }}>
              {newFromProviders.map((service) => (
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
        ) : null}
        <View style={styles.listHeading}>
          <SectionHeading title={selected ? `${categories.find((item) => item.id === selected)?.title ?? 'Services'}` : 'Popular services'} />
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{visible.length} services</Text>
        </View>
        {visible.length > 0 ? (
          <View style={styles.grid}>
            {visible.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                width="48%"
                favorite={favorites.includes(service.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="search" title="No matching services" message="Try another search or clear the category filter." action="Clear filters" onAction={() => { setQuery(''); setSelected(''); }} />
        )}
        <View style={[styles.hint, { backgroundColor: colors.accent }]}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.foreground }]}>Sample listings around {location}</Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7 },
  section: { marginTop: 24, marginBottom: 22 },
  newSection: { marginBottom: 22 },
  listHeading: { marginBottom: 2 },
  resultCount: { fontSize: 11, marginTop: -8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 15, marginTop: 19 },
  hintText: { fontSize: 11, fontWeight: '600' },
});