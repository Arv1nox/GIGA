import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { categories, services } from '@/constants/marketplace';
import { ActionButton, BrandMark, CategoryTile, HorizontalServices, IconButton, Page, SectionHeading, ServiceCard, uiStyles } from '@/components/MarketplaceUI';

const bannerImage = require('@/assets/images/cleaning-banner.jpg');

export default function ShopScreen() {
  const colors = useColors();
  const { location, favorites, toggleFavorite } = useMarketplace();
  const featured = services.slice(0, 4);

  return (
    <Page tabbed>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 8, paddingBottom: 100 }]}>
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <BrandMark compact />
            <Pressable onPress={() => router.push('/location')} style={styles.location}>
              <Feather name="map-pin" size={12} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.locationText, { color: colors.mutedForeground }]}>{location}</Text>
              <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <IconButton icon="bell" accessibilityLabel="Notifications" onPress={() => router.push('/(tabs)/account')} />
        </View>

        <Pressable onPress={() => router.push('/(tabs)/explore')} style={[styles.search, { backgroundColor: colors.card }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Search for a service</Text>
          <View style={{ flex: 1 }} />
          <Feather name="sliders" size={16} color={colors.foreground} />
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/explore')} style={styles.banner}>
          <ImageBackground source={bannerImage} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.bannerImage} />
          <LinearGradient colors={['rgba(22,34,73,0.02)', 'rgba(22,34,73,0.85)']} style={styles.bannerGradient}>
            <View style={[styles.offerTag, { backgroundColor: colors.card }]}><Text style={[styles.offerTagText, { color: colors.foreground }]}>HOME SERVICES IN NAGA</Text></View>
            <Text style={[styles.bannerTitle, { color: '#FFFFFF' }]}>A little care{'\n'}goes a long way.</Text>
            <Text style={[styles.bannerCopy, { color: '#FFFFFF' }]}>Explore local home services</Text>
            <View style={[styles.bannerArrow, { backgroundColor: colors.card }]}><Feather name="arrow-up-right" size={17} color={colors.navy} /></View>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}>
          <SectionHeading title="Find a service" action="See all" onAction={() => router.push('/(tabs)/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 18 }}>
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: category.id } })} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeading title="Featured services" action="See all" onAction={() => router.push('/(tabs)/explore')} />
          <HorizontalServices>
            {featured.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                favorite={favorites.includes(service.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </HorizontalServices>
        </View>

        <Pressable onPress={() => router.push('/settings/promo')} style={styles.promo}>
          <LinearGradient colors={['#2860E8', '#38B6F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoGradient}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTag}>FIRST BOOKING TREAT</Text>
              <Text style={styles.promoTitle}>10% off with code GIGA10</Text>
              <Text style={styles.promoCopy}>Apply it at checkout (demo offer).</Text>
            </View>
            <Text style={styles.promoEmoji}>🎁</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/explore')} style={[styles.partnerCard, { backgroundColor: colors.card }]}>
          <View style={[styles.partnerIcon, { backgroundColor: colors.categoryBlue }]}><Feather name="award" size={20} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.partnerTitle, { color: colors.foreground }]}>Local service partners</Text>
            <Text style={[styles.partnerCopy, { color: colors.mutedForeground }]}>Explore sample services for your neighborhood.</Text>
          </View>
          <Feather name="arrow-right" size={17} color={colors.primary} />
        </Pressable>

        <View style={styles.section}>
          <SectionHeading title="Popular near you" action="Browse" onAction={() => router.push('/(tabs)/explore')} />
          <HorizontalServices>
            {services.slice(2, 6).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                favorite={favorites.includes(service.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </HorizontalServices>
        </View>

        <View style={[styles.bottomNote, { backgroundColor: colors.accent }]}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.bottomNoteText, { color: colors.foreground }]}>Sample listings and prices for preview.</Text>
        </View>
        <View style={{ marginTop: 8 }}><ActionButton label="View my requests" secondary onPress={() => router.push('/(tabs)/requests')} /></View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 1, maxWidth: 250 },
  locationText: { fontSize: 11, fontWeight: '600', maxWidth: 210 },
  search: { minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, marginBottom: 18 },
  banner: { height: 194, borderRadius: 23, overflow: 'hidden', marginBottom: 24 },
  bannerImage: { borderRadius: 23 },
  bannerGradient: { flex: 1, padding: 16, alignItems: 'flex-start', justifyContent: 'flex-end' },
  offerTag: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, marginBottom: 7 },
  offerTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  bannerTitle: { fontSize: 22, lineHeight: 25, fontWeight: '800', letterSpacing: -0.4 },
  bannerCopy: { fontSize: 11, marginTop: 5 },
  bannerArrow: { position: 'absolute', right: 15, bottom: 15, width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 23 },
  promo: { borderRadius: 20, overflow: 'hidden', marginBottom: 23 },
  promoGradient: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  promoTag: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1, opacity: 0.85 },
  promoTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 4 },
  promoCopy: { color: '#FFFFFF', fontSize: 11, marginTop: 4, opacity: 0.9 },
  promoEmoji: { fontSize: 38 },
  partnerCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 18, marginBottom: 23 },
  partnerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  partnerTitle: { fontSize: 13, fontWeight: '800' },
  partnerCopy: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  bottomNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, borderRadius: 15 },
  bottomNoteText: { fontSize: 12, fontWeight: '700' },
});