import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Alert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getService, formatPrice } from '@/constants/marketplace';
import { useMarketplace } from '@/context/MarketplaceContext';
import { ActionButton, IconButton, Page, ServiceImage, uiStyles } from '@/components/MarketplaceUI';
import { FocusedPhoto, serviceFocus } from '@/components/FocusedPhoto';
import { serviceGallery, servicePhotos } from '@/components/ServiceArt';

export default function ServiceDetailsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const service = getService(id);
  const { favorites, toggleFavorite, addRequest } = useMarketplace();
  const [showAreas, setShowAreas] = useState(false);
  const [pickedArea, setPickedArea] = useState<string | null>(null);
  const [heroWidth, setHeroWidth] = useState(0);
  const [slide, setSlide] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

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
  // Cover photo first, then any extra gallery photos. Fewer than two photos means no swiping and no dots.
  const extraPhotos = serviceGallery[service.id] ?? [];
  const slides = extraPhotos.length > 0 && servicePhotos[service.id] ? [servicePhotos[service.id], ...extraPhotos] : [];
  const hasGallery = slides.length > 1;
  const onSlideScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (heroWidth > 0) setSlide(Math.round(event.nativeEvent.contentOffset.x / heroWidth));
  };
  const goToSlide = (index: number) => {
    setSlide(index);
    pagerRef.current?.scrollTo({ x: index * heroWidth, animated: true });
  };
  // The listing location the customer tapped (none until they choose one).
  const selectedArea = pickedArea;
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingHorizontal: 0, paddingBottom: 20 }]}>
        <View style={styles.hero} onLayout={(event) => setHeroWidth(event.nativeEvent.layout.width)}>
          {hasGallery && heroWidth > 0 ? (
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onSlideScroll}
            >
              {slides.map((photo, index) => (
                <FocusedPhoto key={index} source={photo} focus={index === 0 ? serviceFocus[service.id] : undefined} style={{ width: heroWidth, height: 270 }} />
              ))}
            </ScrollView>
          ) : (
            <ServiceImage service={service} style={styles.photo} />
          )}
          <View style={styles.heroTop}>
            <IconButton filled icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
            <IconButton filled icon="heart" color={favorite ? colors.destructive : colors.navy} accessibilityLabel={favorite ? 'Remove from favourites' : 'Add to favourites'} onPress={() => toggleFavorite(service.id)} />
          </View>
          {hasGallery ? (
            <View style={[styles.imageCount, { backgroundColor: colors.card }]}>
              {slides.map((_, index) => (
                <Pressable key={index} onPress={() => goToSlide(index)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Show photo ${index + 1} of ${slides.length}`}>
                  <View style={[styles.dot, { backgroundColor: index === slide ? colors.primary : colors.border }]} />
                </Pressable>
              ))}
            </View>
          ) : null}
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
          <View style={[styles.areaBlock, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => setShowAreas((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showAreas }}
              accessibilityLabel={`Available near ${service.area}. ${showAreas ? 'Hide' : 'Show'} service areas`}
              style={({ pressed }) => [styles.areaHeader, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="map-pin" size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailText, { color: colors.foreground }]}>Available near {service.area}</Text>
                {selectedArea ? (
                  <Text style={[styles.providerMeta, { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>Selected location: {selectedArea}</Text>
                ) : (
                  <Text style={[styles.providerMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    Tap to choose a location · {service.serviceAreas.length} available
                  </Text>
                )}
              </View>
              <Feather name={showAreas ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
            </Pressable>
            {showAreas ? (
              <View style={styles.areaBody}>
                <Text style={[styles.providerMeta, { color: colors.mutedForeground, marginTop: 0 }]}>AVAILABLE LOCATIONS · CHOOSE ONE</Text>
                <View style={styles.areaChips}>
                  {service.serviceAreas.map((area) => {
                    const selected = selectedArea === area;
                    return (
                      <Pressable
                        key={area}
                        onPress={() => setPickedArea(area)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Choose the ${area} location`}
                        style={[styles.areaChip, { backgroundColor: selected ? colors.primary : colors.accent, borderColor: selected ? colors.primary : colors.border }]}
                      >
                        {selected ? <Feather name="check" size={12} color={colors.primaryForeground} /> : null}
                        <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 11, fontWeight: selected ? '700' : '600' }}>{area}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
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
          if (!selectedArea) {
            // Ask for a location first: open the list so they can tap one.
            setShowAreas(true);
            Alert.alert('Choose a location', `Pick a location for ${service.title} from the list.`);
            return;
          }
          void addRequest(service.id, selectedArea)
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
  areaBlock: { borderTopWidth: 1, borderBottomWidth: 1 },
  areaHeader: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 9 },
  areaBody: { gap: 10, paddingBottom: 14 },
  areaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
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