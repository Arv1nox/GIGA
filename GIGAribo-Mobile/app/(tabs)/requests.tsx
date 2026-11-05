import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { getService, formatPrice, type ServiceRequest } from '@/constants/marketplace';
import { ActionButton, EmptyState, IconButton, Page, ServiceImage, uiStyles } from '@/components/MarketplaceUI';
import { RequestCheckout } from '@/components/RequestCheckout';

export default function RequestsScreen() {
  const colors = useColors();
  const { requests, removeRequest, checkoutRequest, cancelRequest, hydrated } = useMarketplace();
  const { session, loading: authLoading } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'checkout' | 'success' | 'cancelConfirm' | 'removeConfirm' | 'cancelled'>('checkout');
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
          <IconButton icon="plus" accessibilityLabel="Browse services" onPress={() => router.push('/(tabs)/explore')} />
        </View>
        {!hydrated ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Loading requests…</Text>
          </View>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No requests yet"
            message="Add a service, then check out here to schedule a demo request."
            action="Explore services"
            onAction={() => router.push('/(tabs)/explore')}
          />
        ) : (
          <View style={{ gap: 13 }}>
            {requests.map((request) => {
              const service = getService(request.serviceId);
              if (!service) return null;
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
                      <View style={[styles.statusDot, { backgroundColor: request.status === 'Cancelled (demo)' ? colors.destructive : colors.primary }]} />
                      <Text style={[styles.statusText, { color: request.status === 'Cancelled (demo)' ? colors.destructive : colors.primary }]}>{request.status}</Text>
                      <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
                    </View>
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
                    ) : request.status === 'Placed (demo)' ? (
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
            <Text style={[styles.tipText, { color: colors.foreground }]}>Checkout and requests are saved on this device for preview. No provider is contacted and no payment is taken.</Text>
          </View>
        ) : null}
        {hydrated && requests.length > 0 ? <View style={{ marginTop: 12 }}><ActionButton label="Browse services" secondary onPress={() => router.push('/(tabs)/explore')} /></View> : null}
      </ScrollView>
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
  loading: { minHeight: 250, justifyContent: 'center', alignItems: 'center', gap: 10 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15, marginTop: 14 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 16 },
});