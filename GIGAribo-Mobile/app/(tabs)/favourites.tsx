import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { EmptyState, Page, ServiceRow, uiStyles } from '@/components/MarketplaceUI';

export default function FavouritesScreen() {
  const colors = useColors();
  const { favorites, toggleFavorite, allServices } = useMarketplace();
  const saved = allServices.filter((service) => favorites.includes(service.id));

  return (
    <Page tabbed>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 12, paddingBottom: 105 }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SAVED FOR LATER</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Favourites</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Keep the services you like close at hand.</Text>
        {saved.length ? (
          <View style={{ gap: 11, marginTop: 22 }}>
            {saved.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                favorite
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <EmptyState
              icon="heart"
              title="Nothing saved yet"
              message="Tap the heart on a service to add it to your favourites."
              action="Find a service"
              onAction={() => router.push('/(tabs)/explore')}
            />
          </View>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4, marginTop: 4 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7 },
  copy: { fontSize: 13, marginTop: 7 },
  emptyWrap: { borderWidth: 1, borderRadius: 22, marginTop: 26 },
});