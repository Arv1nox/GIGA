import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, EmptyState, IconButton, Page, uiStyles } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { categories, formatPrice, type Service } from '@/constants/marketplace';

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type Filter = 'all' | 'live' | 'paused';

const LIVE = '#2E9E6B';
const NATIVE = Platform.OS !== 'web';

function tap() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
}

function animateLayout() {
  if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

/** Pressable that gently shrinks while it is held down. */
function PressScale({
  onPress,
  children,
  style,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(scale, { toValue: value, friction: 6, tension: 200, useNativeDriver: NATIVE }).start();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Provider home: stats, filters and the services this provider has added. */
export default function MyServicesScreen() {
  const colors = useColors();
  const { session, isProvider, loading } = useAuth();
  const { customServices, updateCustomService, removeCustomService, refreshServices } = useMarketplace();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const meta = session?.user.user_metadata ?? {};
  const businessName = String(meta.business_name ?? '').trim();
  const firstName = String(meta.name ?? '').trim().split(' ')[0];
  const mine = customServices.filter((service) => service.ownerId === session?.user.id);
  const live = mine.filter((service) => service.active !== false);
  const paused = mine.filter((service) => service.active === false);
  const deviceOnly = mine.filter((service) => !service.synced);
  const visible = filter === 'live' ? live : filter === 'paused' ? paused : mine;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/account');
  };

  if (!loading && !isProvider) {
    return (
      <Page>
        <View style={styles.gate}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.replace('/(tabs)/shop')} />
          <Text style={[styles.title, { color: colors.foreground }]}>Provider accounts only</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Sign in with a provider account to manage your services.</Text>
          <ActionButton label="Sign in" onPress={() => router.push('/login')} />
        </View>
      </Page>
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    await refreshServices();
    setRefreshing(false);
  }

  async function togglePause(service: Service, makeLive: boolean) {
    tap();
    animateLayout();
    try {
      await updateCustomService(service.id, { active: makeLive });
    } catch (error) {
      Alert.alert('Could not update', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  function confirmRemove(service: Service) {
    Alert.alert('Remove service?', `"${service.title}" will no longer be listed for customers.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          animateLayout();
          removeCustomService(service.id).catch((error) =>
            Alert.alert('Could not remove', error instanceof Error ? error.message : 'Please try again.')
          );
        },
      },
    ]);
  }

  async function retrySync() {
    setRetrying(true);
    let saved = 0;
    for (const service of deviceOnly) {
      try {
        const result = await updateCustomService(service.id, {});
        if (result.synced) saved += 1;
      } catch {
        // keep going; the banner stays if any are left
      }
    }
    setRetrying(false);
    if (saved === deviceOnly.length) Alert.alert('All set', 'Your services are now visible to customers.');
    else Alert.alert('Still not shared', 'We could not reach the shared service list. Make sure the services table is set up in Supabase (supabase/services.sql), then try again.');
  }

  const tiles: { key: Filter; label: string; value: number; icon: FeatherName; tint: string }[] = [
    { key: 'all', label: 'Services', value: mine.length, icon: 'briefcase', tint: colors.primary },
    { key: 'live', label: 'Live', value: live.length, icon: 'eye', tint: LIVE },
    { key: 'paused', label: 'Paused', value: paused.length, icon: 'pause-circle', tint: colors.mutedForeground },
  ];

  return (
    <Page>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 10, paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Feather name="briefcase" size={12} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>PROVIDER</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{firstName ? `Hi, ${firstName}` : 'My services'}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
          {businessName ? `${businessName} · ` : ''}Tap a tile to filter your list.
        </Text>

        <View style={styles.tiles}>
          {tiles.map((tile) => {
            const selected = filter === tile.key;
            return (
              <PressScale
                key={tile.key}
                accessibilityLabel={`${tile.label}: ${tile.value}`}
                onPress={() => {
                  tap();
                  animateLayout();
                  setFilter(tile.key);
                }}
                style={[styles.tile, { backgroundColor: selected ? colors.accent : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Feather name={tile.icon} size={16} color={tile.tint} />
                <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 6 }}>{tile.value}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>{tile.label}</Text>
              </PressScale>
            );
          })}
        </View>

        {deviceOnly.length > 0 ? (
          <View style={[styles.banner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Feather name="cloud-off" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>
                {deviceOnly.length === 1 ? '1 service is only on this phone' : `${deviceOnly.length} services are only on this phone`}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>Customers can't see them until they are shared.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={retrySync} disabled={retrying} hitSlop={8}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{retrying ? 'Sharing...' : 'Share now'}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <ActionButton label="Add a service" icon="plus" onPress={() => router.push('/add-service')} />
        </View>

        {visible.length === 0 ? (
          <View style={{ marginTop: 18 }}>
            {mine.length === 0 ? (
              <EmptyState
                icon="briefcase"
                title="No services yet"
                message="Add your first service so customers nearby can find and request it."
                action="Add a service"
                onAction={() => router.push('/add-service')}
              />
            ) : (
              <EmptyState
                icon={filter === 'live' ? 'eye' : 'pause-circle'}
                title={filter === 'live' ? 'Nothing is live' : 'Nothing is paused'}
                message="Switch services on or off with the toggle on each card."
                action="Show all"
                onAction={() => setFilter('all')}
              />
            )}
          </View>
        ) : (
          <View style={{ marginTop: 18, gap: 12 }}>
            {visible.map((service) => {
              const category = categories.find((item) => item.id === service.category);
              const isLive = service.active !== false;
              return (
                <View key={service.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: isLive ? 1 : 0.78 }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.catIcon, { backgroundColor: colors.accent }]}>
                      <Feather name={(category?.icon ?? 'briefcase') as FeatherName} size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{service.title}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {category?.title ?? 'Service'} · from {formatPrice(service.price)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Switch
                        value={isLive}
                        onValueChange={(next) => togglePause(service, next)}
                        trackColor={{ false: colors.border, true: LIVE }}
                        accessibilityLabel={isLive ? `Pause ${service.title}` : `Make ${service.title} live`}
                      />
                      <Text style={{ color: isLive ? LIVE : colors.mutedForeground, fontSize: 10, fontWeight: '800' }}>{isLive ? 'LIVE' : 'PAUSED'}</Text>
                    </View>
                  </View>

                  <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11 }}>Covers {service.serviceAreas.join(', ')}</Text>

                  <View style={styles.cardBottom}>
                    <View style={styles.syncTag}>
                      <Feather name={service.synced ? 'cloud' : 'smartphone'} size={11} color={service.synced ? LIVE : colors.mutedForeground} />
                      <Text style={{ color: service.synced ? LIVE : colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>
                        {service.synced ? 'Visible to customers' : 'This phone only'}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Preview ${service.title} as a customer`}
                        hitSlop={8}
                        onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                        style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                      >
                        <Feather name="eye" size={15} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${service.title}`}
                        hitSlop={8}
                        onPress={() => router.push({ pathname: '/add-service', params: { id: service.id } })}
                        style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                      >
                        <Feather name="edit-2" size={15} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${service.title}`}
                        hitSlop={8}
                        onPress={() => confirmRemove(service)}
                        style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                      >
                        <Feather name="trash-2" size={15} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabWrap}>
        <PressScale accessibilityLabel="Add a service" onPress={() => { tap(); router.push('/add-service'); }} style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Add</Text>
        </PressScale>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  title: { fontSize: 25, fontWeight: '800', marginTop: 8 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tile: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fabWrap: { position: 'absolute', right: 20, bottom: 26 },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, height: 48, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
});