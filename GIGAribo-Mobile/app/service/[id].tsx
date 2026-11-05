import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getService, formatPrice } from '@/constants/marketplace';
import { useMarketplace } from '@/context/MarketplaceContext';
import { ActionButton, IconButton, Page, ServiceImage, uiStyles } from '@/components/MarketplaceUI';

export default function ServiceDetailsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const service = getService(id);
  const { favorites, toggleFavorite, addRequest } = useMarketplace();

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
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Service not found</Text>
        </View>
      </Page>
    );
  }

  const favorite = favorites.includes(service.id);
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingHorizontal: 0, paddingBottom: 20 }]}>
        <View style={styles.hero}>
          <ServiceImage service={service} style={styles.photo} />
          <View style={styles.heroTop}>
            <IconButton filled icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
            <IconButton filled icon="heart" color={favorite ? colors.destructive : colors.navy} accessibilityLabel={favorite ? 'Remove from favourites' : 'Add to favourites'} onPress={() => toggleFavorite(service.id)} />
          </View>
          <View style={[styles.imageCount, { backgroundColor: colors.card }]}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><View style={[styles.dot, { backgroundColor: colors.border }]} /><View style={[styles.dot, { backgroundColor: colors.border }]} /></View>
        </View>

        <View style={styles.details}>
          <View style={styles.titleLine}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>{service.title}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{service.subtitle}</Text>
            </View>
            <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(service.price)}</Text>
          </View>

          <View style={styles.providerLine}>
            <View style={[styles.providerIcon, { backgroundColor: colors.accent }]}><Feather name="home" size={17} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.providerName, { color: colors.foreground }]}>{service.provider}</Text>
              <Text style={[styles.providerMeta, { color: colors.mutedForeground }]}>Sample service listing</Text>
            </View>
            <View style={styles.rating}><Feather name="star" size={14} color="#F3A64C" /><Text style={[styles.ratingText, { color: colors.foreground }]}>{service.rating.toFixed(1)} ({service.reviews})</Text></View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Service details</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {service.subtitle}. Tell the provider what your home needs and they'll help you plan the next step. The displayed price is a starting estimate.
            </Text>
          </View>
          <View style={[styles.detailRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.foreground }]}>Available near Naga City</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.reviewRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reviews</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Sample ratings for this preview</Text>
            </View>
            <View style={styles.reviewStars}><Feather name="star" size={15} color="#F3A64C" /><Text style={[styles.ratingText, { color: colors.foreground }]}>{service.rating.toFixed(1)}</Text></View>
          </View>
          <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewCardTop}>
              <View style={[styles.reviewAvatar, { backgroundColor: colors.categoryPeach }]}><Text style={{ color: colors.foreground, fontWeight: '800' }}>M</Text></View>
              <View style={{ flex: 1 }}><Text style={[styles.providerName, { color: colors.foreground }]}>Sample review</Text><Text style={[styles.providerMeta, { color: colors.mutedForeground }]}>Preview content</Text></View>
              <Feather name="star" size={13} color="#F3A64C" /><Text style={[styles.ratingText, { color: colors.foreground }]}>5.0</Text>
            </View>
            <Text style={[styles.description, { color: colors.mutedForeground, marginTop: 11 }]}>“Friendly, on time, and really thoughtful about the details. Would book again.”</Text>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.sticky, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View><Text style={[styles.from, { color: colors.mutedForeground }]}>STARTING FROM</Text><Text style={[styles.stickyPrice, { color: colors.foreground }]}>{formatPrice(service.price)}</Text></View>
        <ActionButton label="Add to requests" onPress={() => {
          void addRequest(service.id)
            // Go back to the home page; it shows a "Request added" popup.
            .then(() => router.dismissTo({ pathname: '/(tabs)/shop', params: { added: service.title, t: String(Date.now()) } }))
            .catch(() => Alert.alert('Could not save request', 'Please try again. Nothing was added to Requests.'));
        }} style={{ flex: 1 }} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { height: 270, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  photo: { height: 270 },
  heroTop: { position: 'absolute', top: 12, left: 16, right: 16, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  imageCount: { position: 'absolute', bottom: 13, alignSelf: 'center', borderRadius: 20, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  dot: { width: 5, height: 5, borderRadius: 4 },
  details: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 18 },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  providerLine: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  providerIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  providerName: { fontSize: 13, fontWeight: '800' },
  providerMeta: { fontSize: 10, marginTop: 3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1 },
  section: { gap: 7 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 19 },
  detailRow: { minHeight: 49, borderTopWidth: 1, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  detailText: { flex: 1, fontSize: 12, fontWeight: '600' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewStars: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  reviewCard: { borderWidth: 1, borderRadius: 17, padding: 13 },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sticky: { paddingHorizontal: 19, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  from: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  stickyPrice: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  missing: { flex: 1, padding: 22, gap: 18 },
});