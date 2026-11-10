import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { getService, formatPrice, type ServiceRequest } from '@/constants/marketplace';
import { ActionButton, EmptyState, IconButton, Page, ServiceImage, uiStyles } from '@/components/MarketplaceUI';
import { RequestCheckout } from '@/components/RequestCheckout';
import { RateServiceModal } from '@/components/RateServiceModal';

type View_ = 'pending' | 'active' | 'history';

/** Accepted by the provider and waiting for the service to be done. */
function isActiveRequest(request: ServiceRequest) {
  return request.status === 'Placed (demo)' && request.providerStatus === 'confirmed';
}

/** A request is "past" once it was cancelled, or the provider completed or declined it. */
function isPastRequest(request: ServiceRequest) {
  if (request.status === 'Cancelled (demo)') return true;
  return request.status === 'Placed (demo)' && ['completed', 'declined', 'cancelled'].includes(request.providerStatus ?? '');
}

export default function RequestsScreen() {
  const colors = useColors();
  const { requests, removeRequest, removeRequests, checkoutRequest, cancelRequest, hydrated, myRatings, rateRequest } = useMarketplace();
  const { session, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ tab?: string; checkout?: string; rate?: string; t?: string }>();
  const [view, setView] = useState<View_>(params.tab === 'history' ? 'history' : params.tab === 'active' ? 'active' : 'pending');
  // Tabs stay mounted, so follow the tab asked for (e.g. from the "Booking completed" pop-up).
  useEffect(() => {
    if (params.tab === 'history' || params.tab === 'active' || params.tab === 'pending') setView(params.tab);
  }, [params.tab]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'checkout' | 'success' | 'cancelConfirm' | 'removeConfirm' | 'cancelled'>('checkout');
  // Coming from "Add to requests": open the checkout panel for that request right away.
  useEffect(() => {
    if (!params.checkout) return;
    if (!requests.some((request) => request.id === params.checkout)) return;
    setView('pending');
    setActiveId(params.checkout);
    setMode('checkout');
    router.setParams({ checkout: undefined, t: undefined });
  }, [params.checkout, params.t, requests]);
  // Pending: waiting for checkout or for the provider to answer. Active: accepted. History: done, declined or cancelled.
  const pastRequests = requests.filter(isPastRequest);
  const activeRequests = requests.filter((request) => !isPastRequest(request) && isActiveRequest(request));
  const pendingRequests = requests.filter((request) => !isPastRequest(request) && !isActiveRequest(request));
  const shown = view === 'history' ? pastRequests : view === 'active' ? activeRequests : pendingRequests;
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  async function deleteAllHistory() {
    if (clearing) return;
    setClearing(true);
    setClearError('');
    try {
      await removeRequests(requests.filter(isPastRequest).map((request) => request.id));
      setConfirmClear(false);
    } catch {
      setClearError('Could not delete your history. Please try again; nothing was removed.');
    } finally {
      setClearing(false);
    }
  }
  const ratingRequest = requests.find((request) => request.id === ratingId);
  // Coming from the "Booking completed" alert or notification: open the rating pop-up right away.
  useEffect(() => {
    if (!params.rate || !hydrated) return;
    const target = requests.find((request) => request.id === params.rate);
    if (!target) return;
    setView('history');
    if (target.providerStatus === 'completed' && !myRatings[target.id]) setRatingId(target.id);
    router.setParams({ rate: undefined, t: undefined });
  }, [params.rate, params.t, hydrated, requests, myRatings]);
  const ratingService = getService(ratingRequest?.serviceId);
  const activeRequest = requests.find((request) => request.id === activeId);
  const activeService = getService(activeRequest?.serviceId);

  function goToLogin() {
    router.push({ pathname: '/login', params: { redirect: '/(tabs)/requests' } });
  }

  function confirmRemove(request: ServiceRequest) {
    setActiveId(request.id);
    setMode('removeConfirm');
  }

  function confirmCancel(request: ServiceRequest) {
    setActiveId(request.id);
    setMode('cancelConfirm');
  }

  return (
    <Page tabbed>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 12, paddingBottom: 105 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR HOME, ON THE WAY</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Requests</Text>
          </View>
        </View>
        {hydrated && requests.length > 0 ? (
          <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {([['pending', 'Pending', pendingRequests.length], ['active', 'Active', activeRequests.length], ['history', 'History', pastRequests.length]] as const).map(([key, label, count]) => {
              const selected = view === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setView(key)}
                  style={[styles.segmentItem, { backgroundColor: selected ? colors.accent : 'transparent' }]}
                >
                  <Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '800' }}>{label} · {count}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {!hydrated ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Loading requests…</Text>
          </View>
        ) : shown.length === 0 ? (
          view === 'history' ? (
            <EmptyState
              icon="clock"
              title="No past bookings yet"
              message="Completed, declined and cancelled bookings are kept here."
              action="See pending requests"
              onAction={() => setView('pending')}
            />
          ) : view === 'active' ? (
            <EmptyState
              icon="check-circle"
              title="No active requests"
              message="Requests the provider has accepted show up here until the service is done."
              action="See pending requests"
              onAction={() => setView('pending')}
            />
          ) : (
            <EmptyState
              icon="clipboard"
              title={requests.length === 0 ? 'No requests yet' : 'No pending requests'}
              message={requests.length === 0 ? 'Add a service, then check out here to schedule a demo request.' : 'Accepted requests are in Active and finished ones are in History.'}
              action="Explore services"
              onAction={() => router.push('/(tabs)/explore')}
            />
          )
        ) : view === 'history' ? (
          <View style={{ gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete all history"
              onPress={() => { setClearError(''); setConfirmClear(true); }}
              style={[styles.clearAll, { borderColor: colors.border }]}
            >
              <Feather name="trash-2" size={13} color={colors.destructive} />
              <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '800' }}>Delete all history</Text>
            </Pressable>
            {pastRequests.map((request) => {
              const service = getService(request.serviceId);
              if (!service) return null;
              const a = request.providerStatus;
              const info = request.status === 'Cancelled (demo)' || a === 'cancelled'
                ? { label: 'Cancelled', color: colors.destructive }
                : a === 'declined' ? { label: 'Declined by provider', color: colors.destructive } : { label: 'Completed', color: '#2E9E6B' };
              const when = request.checkout
                ? `${new Date(`${request.checkout.scheduledDate}T12:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} · ${request.checkout.timeSlot}`
                : new Date(request.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <View key={request.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
                    <ServiceImage service={service} style={styles.historyPhoto} />
                  </Pressable>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text numberOfLines={1} style={[styles.serviceName, { color: colors.foreground }]}>{service.title}</Text>
                    <Text numberOfLines={1} style={[styles.provider, { color: colors.mutedForeground, marginTop: 0 }]}>{service.provider}</Text>
                    <View style={styles.statusLine}>
                      <View style={[styles.statusDot, { backgroundColor: info.color }]} />
                      <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
                    </View>
                    <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11 }}>{when}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{formatPrice(request.checkout?.total ?? service.price)}</Text>
                    {a === 'completed' && request.providerNotified && service.ownerId ? (
                      myRatings[request.id] ? (
                        <View style={styles.rateLine}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Feather key={value} name="star" size={12} color={value <= myRatings[request.id] ? '#F3A64C' : colors.border} />
                          ))}
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>You rated this</Text>
                        </View>
                      ) : (
                        <Pressable accessibilityRole="button" accessibilityLabel={`Rate ${service.title}`} onPress={() => setRatingId(request.id)} style={[styles.rateButton, { backgroundColor: colors.accent }]}>
                          <Feather name="star" size={12} color="#F3A64C" />
                          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Rate this service</Text>
                        </Pressable>
                      )
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <IconButton icon="trash-2" size={17} accessibilityLabel="Remove from history" onPress={() => confirmRemove(request)} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${service.title} again`}
                      onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                      style={[styles.again, { backgroundColor: colors.accent }]}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Book again</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: 13 }}>
            {shown.map((request) => {
              const service = getService(request.serviceId);
              if (!service) return null;
              // Once the provider answers, show their answer instead of the plain "Placed" status.
              const answer = request.status === 'Placed (demo)' ? request.providerStatus : undefined;
              const statusColor = request.status === 'Cancelled (demo)' || answer === 'declined'
                ? colors.destructive
                : answer === 'confirmed' || answer === 'completed' ? '#2E9E6B' : colors.primary;
              const statusLabel = answer === 'confirmed'
                ? 'Accepted by provider'
                : answer === 'completed' ? 'Completed' : answer === 'declined' ? 'Declined by provider' : request.status;
              const date = new Date(request.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
              return (
                <View
                  key={request.id}
                  style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}>
                    <ServiceImage service={service} style={styles.photo} />
                  </Pressable>
                  <View style={styles.requestBody}>
                    <View style={styles.requestTop}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.serviceName, { color: colors.foreground }]}>{service.title}</Text>
                        <Text style={[styles.provider, { color: colors.mutedForeground }]}>{service.provider}</Text>
                      </View>
                      {request.status !== 'Placed (demo)' ? <IconButton icon="x" accessibilityLabel="Remove request" onPress={() => confirmRemove(request)} /> : null}
                    </View>
                    <View style={styles.statusLine}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
                    </View>
                    {request.serviceArea ? (
                      <View style={styles.scheduled}>
                        <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                        <Text numberOfLines={1} style={[styles.scheduleText, { color: colors.mutedForeground }]}>{request.serviceArea}</Text>
                      </View>
                    ) : null}
                    {request.status === 'Placed (demo)' && service.ownerId ? (
                      <View style={styles.scheduled}>
                        <Feather name={request.providerNotified ? 'send' : 'smartphone'} size={13} color={request.providerNotified ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.scheduleText, { color: request.providerNotified ? colors.primary : colors.mutedForeground }]}>
                          {!request.providerNotified
                            ? 'Could not reach the provider'
                            : answer === 'confirmed' ? 'The provider will see you at the scheduled time'
                              : answer === 'completed' ? 'The provider marked this as done'
                                : answer === 'declined' ? 'Try another provider from Explore'
                                  : 'Sent to the provider, waiting for their answer'}
                        </Text>
                      </View>
                    ) : null}
                    {request.checkout ? (
                      <View style={styles.scheduled}>
                        <Feather name="calendar" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.scheduleText, { color: colors.mutedForeground }]}>
                          {new Date(`${request.checkout.scheduledDate}T12:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {request.checkout.timeSlot}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(request.checkout?.total ?? service.price)} <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>{request.checkout ? 'demo total' : 'starting price'}</Text></Text>
                    {request.status === 'Pending checkout' ? (
                      session ? (
                        <ActionButton label="Checkout" icon="arrow-right" onPress={() => { setActiveId(request.id); setMode('checkout'); }} />
                      ) : (
                        <ActionButton label="Sign in to check out" icon="log-in" disabled={authLoading} onPress={goToLogin} />
                      )
                    ) : request.status === 'Placed (demo)' && answer !== 'declined' && answer !== 'completed' ? (
                      <Pressable accessibilityRole="button" onPress={() => confirmCancel(request)} style={styles.cancelLink}>
                        <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel demo request</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {hydrated && requests.length > 0 ? (
          <View style={[styles.tip, { backgroundColor: colors.accent }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.foreground }]}>Requests are saved on this device. Bookings for services added by local providers are sent to that provider. No payment is taken.</Text>
          </View>
        ) : null}
        {hydrated && requests.length > 0 ? <View style={{ marginTop: 12 }}><ActionButton label="Browse services" secondary onPress={() => router.push('/(tabs)/explore')} /></View> : null}
      </ScrollView>
      {confirmClear ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmClear(false)}>
          <View style={[styles.confirmBackdrop, { backgroundColor: colors.modalScrim }]}>
            <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
              <View style={[styles.confirmIcon, { backgroundColor: colors.accent }]}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </View>
              <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Delete all history?</Text>
              <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
                This removes {pastRequests.length} past {pastRequests.length === 1 ? 'booking' : 'bookings'} (completed, declined and cancelled) from your history. This can&apos;t be undone. Pending and active requests are not affected.
              </Text>
              {clearError ? <Text accessibilityRole="alert" style={[styles.confirmBody, { color: colors.destructive }]}>{clearError}</Text> : null}
              <ActionButton label={clearing ? 'Deleting…' : 'Yes, delete all'} icon="trash-2" disabled={clearing} onPress={() => { void deleteAllHistory(); }} style={{ alignSelf: 'stretch', backgroundColor: colors.destructive }} />
              <ActionButton label="Keep my history" secondary disabled={clearing} onPress={() => setConfirmClear(false)} style={{ alignSelf: 'stretch' }} />
            </View>
          </View>
        </Modal>
      ) : null}
      {ratingRequest && ratingService ? (
        <RateServiceModal
          key={ratingRequest.id}
          serviceTitle={ratingService.title}
          provider={ratingService.provider}
          onClose={() => setRatingId(null)}
          onSubmit={(stars, comment) => rateRequest(ratingRequest.id, stars, comment)}
        />
      ) : null}
      {activeRequest && activeService ? (
        <RequestCheckout
          key={activeRequest.id}
          request={activeRequest}
          service={activeService}
          mode={mode}
          onClose={() => setActiveId(null)}
          onBackHome={() => { setActiveId(null); router.push('/(tabs)/shop'); }}
          onPlace={async (details) => {
            if (!session) {
              // Session expired while the sheet was open.
              setActiveId(null);
              goToLogin();
              return;
            }
            await checkoutRequest(activeRequest.id, details);
            setMode('success');
          }}
          onCancel={async () => { await cancelRequest(activeRequest.id); setMode('cancelled'); }}
          onRemove={async () => { await removeRequest(activeRequest.id); setActiveId(null); }}
        />
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7 },
  requestCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  photo: { height: 125 },
  requestBody: { padding: 13, gap: 11 },
  requestTop: { flexDirection: 'row', alignItems: 'center' },
  serviceName: { fontSize: 15, fontWeight: '800' },
  provider: { fontSize: 11, marginTop: 3 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: '800' },
  date: { marginLeft: 'auto', fontSize: 11 },
  price: { fontSize: 13, fontWeight: '800' },
  scheduled: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontSize: 11, fontWeight: '600' },
  cancelLink: { alignSelf: 'flex-start', paddingVertical: 6 },
  cancelText: { fontSize: 11, fontWeight: '700' },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, marginBottom: 16 },
  segmentItem: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 9 },
  historyCard: { flexDirection: 'row', alignItems: 'stretch', gap: 12, borderWidth: 1, borderRadius: 18, padding: 10 },
  historyPhoto: { width: 84, height: 96, borderRadius: 14 },
  clearAll: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  confirmBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 23 },
  confirmCard: { borderRadius: 20, padding: 22, alignItems: 'center', gap: 12, width: '100%', maxWidth: 420, alignSelf: 'center' },
  confirmIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: 19, fontWeight: '800' },
  confirmBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  rateLine: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  rateButton: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, marginTop: 2 },
  again: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7 },
  loading: { minHeight: 250, justifyContent: 'center', alignItems: 'center', gap: 10 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15, marginTop: 14 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 16 },
});