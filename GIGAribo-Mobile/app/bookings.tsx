import React, { useCallback, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Alert } from '@/lib/alert';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useMarketplace } from '@/context/MarketplaceContext';
import { formatPrice } from '@/constants/marketplace';
import type { Booking, BookingStatus } from '@/lib/remoteBookings';
import { ActionButton, EmptyState, IconButton, Page, uiStyles } from '@/components/MarketplaceUI';

type Filter = 'active' | 'new' | 'confirmed' | 'history';

const LIVE = '#2E9E6B';
const WARN = '#F3A64C';

const statusLabel: Record<BookingStatus, string> = {
  new: 'NEW',
  confirmed: 'ACCEPTED',
  completed: 'COMPLETED',
  declined: 'DECLINED',
  cancelled: 'CANCELLED BY CUSTOMER',
};

function formatDay(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Provider view: every booking customers made for their services. */
export default function BookingsScreen() {
  const colors = useColors();
  const { isProvider, loading } = useAuth();
  const { bookings, refreshBookings, markBookingsSeen, updateBookingStatus } = useMarketplace();
  const [filter, setFilter] = useState<Filter>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Opening the list counts as reading the new bookings.
  useFocusEffect(useCallback(() => {
    void refreshBookings().then(() => markBookingsSeen());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my-services');
  };

  if (!loading && !isProvider) {
    return (
      <Page>
        <View style={styles.gate}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.replace('/(tabs)/shop')} />
          <Text style={[styles.title, { color: colors.foreground }]}>Provider accounts only</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Sign in with a provider account to see bookings.</Text>
          <ActionButton label="Sign in" onPress={() => router.push('/login')} />
        </View>
      </Page>
    );
  }

  // Finished bookings (completed, declined or cancelled) move out of the active list into History.
  const isDone = (item: Booking) => item.status === 'completed' || item.status === 'declined' || item.status === 'cancelled';
  const counts: Record<Filter, number> = {
    active: bookings.filter((item) => !isDone(item)).length,
    new: bookings.filter((item) => item.status === 'new').length,
    confirmed: bookings.filter((item) => item.status === 'confirmed').length,
    history: bookings.filter(isDone).length,
  };
  const visible = filter === 'history'
    ? bookings.filter(isDone)
    : filter === 'active' ? bookings.filter((item) => !isDone(item)) : bookings.filter((item) => item.status === filter);
  const filters: { key: Filter; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'new', label: 'New' },
    { key: 'confirmed', label: 'Accepted' },
    { key: 'history', label: 'History' },
  ];

  async function answer(booking: Booking, status: BookingStatus) {
    setBusyId(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
    } catch (error) {
      Alert.alert('Could not update', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  function confirmDecline(booking: Booking) {
    Alert.alert('Decline this booking?', `${booking.customerName} will see that you could not take "${booking.serviceTitle}".`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => void answer(booking, 'declined') },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  }

  const statusColor = (status: BookingStatus) =>
    status === 'new' ? WARN : status === 'confirmed' || status === 'completed' ? LIVE : colors.mutedForeground;

  return (
    <Page>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 10, paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Bookings</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
          {counts.new > 0 ? `${counts.new} waiting for your answer.` : 'Completed bookings move to History.'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.key)}
                style={[styles.filter, { backgroundColor: selected ? colors.accent : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Text style={{ color: selected ? colors.primary : colors.foreground, fontSize: 12, fontWeight: '700' }}>
                  {item.label} · {counts[item.key]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visible.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={bookings.length === 0 ? 'No bookings yet' : filter === 'history' ? 'No past bookings yet' : 'Nothing here'}
            message={bookings.length === 0
              ? 'When a customer books one of your services you will get a notification and it will appear here.'
              : filter === 'history' ? 'Completed, declined and cancelled bookings are kept here.' : 'Try another filter.'}
            action={bookings.length === 0 ? 'Add a service' : 'Show active'}
            onAction={() => (bookings.length === 0 ? router.push('/add-service') : setFilter('active'))}
          />
        ) : (
          <View style={{ gap: 12 }}>
            {visible.map((booking) => {
              const tint = statusColor(booking.status);
              const busy = busyId === booking.id;
              return (
                <View key={booking.id} style={[styles.card, { backgroundColor: colors.card, borderColor: booking.status === 'new' ? WARN : colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{booking.serviceTitle}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Booked {timeAgo(booking.createdAt)}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                      <Text style={{ color: tint, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>{statusLabel[booking.status]}</Text>
                    </View>
                  </View>

                  <View style={styles.rows}>
                    <View style={styles.row}>
                      <Feather name="user" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.rowText, { color: colors.foreground }]}>{booking.customerName}</Text>
                    </View>
                    <View style={styles.row}>
                      <Feather name="calendar" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.rowText, { color: colors.foreground }]}>{formatDay(booking.scheduledDate)} · {booking.timeSlot}</Text>
                    </View>
                    <View style={styles.row}>
                      <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.rowText, { color: colors.foreground }]}>{booking.serviceArea || 'Area not given'}</Text>
                    </View>
                    <View style={styles.row}>
                      <Feather name="credit-card" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.rowText, { color: colors.foreground }]}>
                        {formatPrice(booking.total)} · {booking.paymentMethod}{booking.promoCode ? ` · ${booking.promoCode}` : ''}
                      </Text>
                    </View>
                  </View>

                  {booking.customerPhone ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${booking.customerName}`}
                      onPress={() => void Linking.openURL(`tel:${booking.customerPhone}`)}
                      style={[styles.callBtn, { backgroundColor: colors.accent }]}
                    >
                      <Feather name="phone" size={13} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{booking.customerPhone}</Text>
                    </Pressable>
                  ) : null}

                  {booking.status === 'new' ? (
                    <View style={styles.actions}>
                      <ActionButton label="Accept" icon="check" disabled={busy} onPress={() => void answer(booking, 'confirmed')} style={styles.actionBtn} />
                      <ActionButton label="Decline" secondary disabled={busy} onPress={() => confirmDecline(booking)} style={styles.actionBtn} />
                    </View>
                  ) : booking.status === 'confirmed' ? (
                    <ActionButton label="Mark as completed" icon="check-circle" secondary disabled={busy} onPress={() => void answer(booking, 'completed')} />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 25, fontWeight: '800', marginTop: 8 },
  filters: { gap: 8, paddingVertical: 16, paddingRight: 18 },
  filter: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  card: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  rows: { gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 12, fontWeight: '600', flex: 1 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, minHeight: 44 },
});