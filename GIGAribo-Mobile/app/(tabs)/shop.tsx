import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageBackground, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { categories, getService } from '@/constants/marketplace';

import { Toast } from '@/components/Toast';
import { GetStartedCard, GetStartedTour, useGetStartedTour } from '@/components/GetStartedTour';
import { ActionButton, BrandMark, CategoryTile, IconButton, Page, SectionHeading, ServiceCard, ServiceGrid, ServiceRow, uiStyles } from '@/components/MarketplaceUI';

const bannerImage = require('@/assets/images/cleaning-banner.jpg');

type Notice = {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  time: string;
  route: Href;
  unread: boolean;
};

const NOTICE_STORE = 'gigaribo-notices-v1';

// Sample notifications for the demo.
const initialNotices: Notice[] = [
  { id: 'welcome', icon: 'gift', title: 'Welcome to GIGAribo', body: 'Use code GIGA10 for 10% off your first booking (demo offer).', time: 'Just now', route: '/settings/promo', unread: true },
  { id: 'requests', icon: 'file-text', title: 'Your requests', body: 'Add a service to Requests, then pick a date and check out.', time: 'Today', route: '/(tabs)/requests', unread: true },
  { id: 'top-rated', icon: 'star', title: 'Top rated near you', body: 'Roofing and House cleaning are both rated 4.9 this week.', time: 'Yesterday', route: '/(tabs)/explore', unread: false },
];

export default function ShopScreen() {
  const colors = useColors();
  const { location, favorites, toggleFavorite, allServices, customServices, requests, myRatings } = useMarketplace();
  const insets = useSafeAreaInsets();
  const featured = allServices.slice(0, 4);
  // Services providers added in the app, newest first (paused ones are hidden from customers).
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const activeCustom = customServices.filter((service) => service.active !== false);
  // Tapping a category on the home page narrows this list to that category only.
  const newFromProviders = selectedCategory ? activeCustom.filter((service) => service.category === selectedCategory) : activeCustom;
  const selectedTitle = categories.find((item) => item.id === selectedCategory)?.title;
  // Set by the service page after "Add to requests" to show the popup here.
  const { added, t } = useLocalSearchParams<{ added?: string; t?: string }>();
  const tour = useGetStartedTour();
  const [notifOpen, setNotifOpen] = useState(false);
  // Which notifications the customer already read or dismissed (kept on the device).
  const [noticeStore, setNoticeStore] = useState<{ dismissed: string[]; read: string[] }>({ dismissed: [], read: [] });
  const [noticesLoaded, setNoticesLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(NOTICE_STORE)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { dismissed?: string[]; read?: string[] };
        setNoticeStore({
          dismissed: Array.isArray(saved.dismissed) ? saved.dismissed : [],
          read: Array.isArray(saved.read) ? saved.read : [],
        });
      })
      .catch(() => {})
      .finally(() => setNoticesLoaded(true));
  }, []);
  const updateNoticeStore = (next: { dismissed: string[]; read: string[] }) => {
    setNoticeStore(next);
    void AsyncStorage.setItem(NOTICE_STORE, JSON.stringify(next));
  };

  // Notifications come from what happens to the customer's requests. Each event has its own id, so a dismissed
  // notification stays gone until something new happens (e.g. the provider accepts the request).
  const isRead = (id: string) => noticeStore.read.includes(id);
  const whenAdded = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const rateNotices: Notice[] = [];
  const acceptedNotices: Notice[] = [];
  const placedNotices: Notice[] = [];
  const addedNotices: Notice[] = [];
  for (const request of requests) {
    const service = getService(request.serviceId);
    const name = service?.title ?? 'Your service';
    if (request.status === 'Pending checkout') {
      const id = `added-${request.id}`;
      addedNotices.push({ id, icon: 'plus-circle', title: 'Request added', body: `${name} is waiting for checkout. Tap to finish.`, time: whenAdded(request.createdAt), route: { pathname: '/(tabs)/requests', params: { checkout: request.id, t: request.id } } as Href, unread: !isRead(id) });
    } else if (request.status === 'Placed (demo)') {
      if (request.providerStatus === 'completed' && request.providerNotified && !myRatings[request.id]) {
        const id = `rate-${request.id}`;
        rateNotices.push({ id, icon: 'star', title: 'Your service is done', body: `${name} was completed. Tap to rate it.`, time: 'Recently', route: { pathname: '/(tabs)/requests', params: { tab: 'history', rate: request.id } } as Href, unread: !isRead(id) });
      } else if (request.providerStatus === 'confirmed') {
        const id = `accepted-${request.id}`;
        acceptedNotices.push({ id, icon: 'check-circle', title: 'Request accepted', body: `${service?.provider ?? 'The provider'} accepted ${name}.`, time: 'Recently', route: { pathname: '/(tabs)/requests', params: { tab: 'active' } } as Href, unread: !isRead(id) });
      } else if (!request.providerStatus || request.providerStatus === 'new') {
        const id = `placed-${request.id}`;
        placedNotices.push({ id, icon: 'send', title: 'Request placed', body: `${name} is waiting for the provider's answer.`, time: whenAdded(request.createdAt), route: { pathname: '/(tabs)/requests', params: { tab: 'pending' } } as Href, unread: !isRead(id) });
      }
    }
  }
  const sampleNotices = initialNotices.map((notice) => ({ ...notice, unread: notice.unread && !isRead(notice.id) }));
  const allNotices = noticesLoaded
    ? [...rateNotices, ...acceptedNotices, ...placedNotices, ...addedNotices, ...sampleNotices].filter((notice) => !noticeStore.dismissed.includes(notice.id))
    : [];
  const unreadCount = allNotices.filter((notice) => notice.unread).length;
  // Place the popup just under the bell (page top padding + scroll padding + header height).
  const popupTop = (Platform.OS === 'web' ? 12 : insets.top) + 8 + 46;

  const openNotice = (notice: Notice) => {
    if (!isRead(notice.id)) updateNoticeStore({ ...noticeStore, read: [...noticeStore.read, notice.id] });
    setNotifOpen(false);
    router.push(notice.route);
  };
  const markAllRead = () => updateNoticeStore({ ...noticeStore, read: Array.from(new Set([...noticeStore.read, ...allNotices.map((notice) => notice.id)])) });
  // The X on a notification removes it for good.
  const dismissNotice = (id: string) => updateNoticeStore({ ...noticeStore, dismissed: [...noticeStore.dismissed.filter((item) => item !== id), id] });

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
          <View>
            <IconButton filled icon="bell" accessibilityLabel="Notifications" onPress={() => setNotifOpen(true)} />
            {unreadCount > 0 ? (
              <View pointerEvents="none" style={[styles.badge, { backgroundColor: colors.destructive, borderColor: colors.background }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable onPress={() => router.push('/(tabs)/explore')} style={[styles.search, { backgroundColor: colors.card }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Search for a service</Text>
          <View style={{ flex: 1 }} />
          <Feather name="sliders" size={16} color={colors.foreground} />
        </Pressable>

        <GetStartedCard onPress={tour.show} />

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
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                width="31.5%"
                selected={selectedCategory === category.id}
                onPress={() => {
                  // Filter the home page's local providers and jump to Explore for that category.
                  setSelectedCategory(category.id);
                  router.push({ pathname: '/(tabs)/explore', params: { category: category.id } });
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading title="Featured services" action="See all" onAction={() => router.push('/(tabs)/explore')} />
          <ServiceGrid>
            {featured.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                width="48%"
                favorite={favorites.includes(service.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </ServiceGrid>
        </View>

        {activeCustom.length > 0 || selectedCategory ? (
          <View style={styles.section}>
            <SectionHeading
              title={selectedTitle ? `New from local providers · ${selectedTitle}` : 'New from local providers'}
              action="See all"
              onAction={() => router.push(selectedCategory ? { pathname: '/(tabs)/explore', params: { category: selectedCategory } } : '/(tabs)/explore')}
            />
            {selectedCategory ? (
              <Pressable accessibilityRole="button" onPress={() => setSelectedCategory(null)} style={styles.clearFilter}>
                <Feather name="x" size={12} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Show all categories</Text>
              </Pressable>
            ) : null}
            <View style={{ gap: 12 }}>
              {newFromProviders.length === 0 ? (
                <View style={[styles.bottomNote, { backgroundColor: colors.accent }]}>
                  <Feather name="info" size={16} color={colors.primary} />
                  <Text style={[styles.bottomNoteText, { color: colors.foreground }]}>No local providers in {selectedTitle} yet.</Text>
                </View>
              ) : null}
              {newFromProviders.slice(0, 3).map((service) => (
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
          <View style={{ gap: 12 }}>
            {allServices.slice(2, 5).map((service) => (
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

        <View style={[styles.bottomNote, { backgroundColor: colors.accent }]}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.bottomNoteText, { color: colors.foreground }]}>Sample listings and prices for preview.</Text>
        </View>
        <View style={{ marginTop: 8 }}><ActionButton label="View my requests" secondary onPress={() => router.push('/(tabs)/requests')} /></View>
      </ScrollView>

      <Modal visible={notifOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.modalScrim }]}
            onPress={() => setNotifOpen(false)}
          />
          <View pointerEvents="box-none" style={[styles.popupWrap, { paddingTop: popupTop }]}>
            <View style={[styles.popup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.popupHeader}>
                <Text style={[styles.popupTitle, { color: colors.foreground }]}>Notifications</Text>
                <View style={styles.popupActions}>
                  {unreadCount > 0 ? (
                    <Pressable onPress={markAllRead} accessibilityRole="button" hitSlop={8}>
                      <Text style={[styles.markRead, { color: colors.primary }]}>Mark all read</Text>
                    </Pressable>
                  ) : null}
                  <IconButton icon="x" size={18} accessibilityLabel="Close notifications" onPress={() => setNotifOpen(false)} />
                </View>
              </View>
              {allNotices.length === 0 ? (
                <Text style={[styles.noticeEmpty, { color: colors.mutedForeground }]}>You&apos;re all caught up.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                  {allNotices.map((notice, index) => (
                    <View key={notice.id} style={[styles.notice, { borderTopColor: colors.border, borderTopWidth: index === 0 ? 0 : 1 }]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openNotice(notice)}
                        style={({ pressed }) => [styles.noticeMain, { backgroundColor: pressed ? colors.muted : 'transparent' }]}
                      >
                        <View style={[styles.noticeIcon, { backgroundColor: colors.accent }]}>
                          <Feather name={notice.icon} size={17} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>{notice.title}</Text>
                          <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>{notice.body}</Text>
                          <Text style={[styles.noticeTime, { color: colors.mutedForeground }]}>{notice.time}</Text>
                        </View>
                      </Pressable>
                      <View style={styles.noticeSide}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${notice.title}`} hitSlop={8} onPress={() => dismissNotice(notice.id)} style={styles.noticeX}>
                          <Feather name="x" size={15} color={colors.mutedForeground} />
                        </Pressable>
                        {notice.unread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <GetStartedTour visible={tour.open} onClose={tour.close} />
      <Toast
        trigger={added ? (t ?? added) : null}
        title="Request added"
        detail={added}
        onPress={() => router.push('/(tabs)/requests')}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, borderWidth: 2, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  modalRoot: { flex: 1 },
  popupWrap: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20 },
  popup: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0E1838',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  popupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 6, paddingTop: 8, paddingBottom: 4 },
  popupTitle: { fontSize: 16, fontWeight: '800' },
  popupActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markRead: { fontSize: 11, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'stretch' },
  noticeMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingLeft: 16, paddingVertical: 13, paddingRight: 4 },
  noticeSide: { alignItems: 'center', gap: 10, paddingTop: 12, paddingRight: 12, paddingLeft: 4, width: 36 },
  noticeX: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeEmpty: { fontSize: 12, textAlign: 'center', paddingVertical: 28 },
  noticeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 13, fontWeight: '800' },
  noticeBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  noticeTime: { fontSize: 10, marginTop: 6, opacity: 0.8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
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
  clearFilter: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(40,96,232,0.1)' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
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