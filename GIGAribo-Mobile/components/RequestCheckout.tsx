import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ActionButton, IconButton } from '@/components/MarketplaceUI';
import { formatCheckoutPrice, type CheckoutDetails, type Service, type ServiceRequest } from '@/constants/marketplace';

type Mode = 'checkout' | 'success' | 'cancelConfirm' | 'removeConfirm' | 'cancelled';
type Section = 'schedule' | 'payment' | 'promo' | null;

type Props = {
  request: ServiceRequest;
  service: Service;
  mode: Mode;
  onClose: () => void;
  onBackHome: () => void;
  onPlace: (details: CheckoutDetails) => Promise<void>;
  onCancel: () => Promise<void>;
  onRemove: () => Promise<void>;
};

const timeSlots = ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'] as const;
const paymentOptions: CheckoutDetails['paymentMethod'][] = ['Pay after service', 'Demo card'];

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, { backgroundColor: selected ? colors.accent : colors.card, borderColor: selected ? colors.primary : colors.border }]}
    >
      <Text style={[styles.choiceLabel, { color: selected ? colors.primary : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function RequestCheckout({ request, service, mode, onClose, onBackHome, onPlace, onCancel, onRemove }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [payment, setPayment] = useState<CheckoutDetails['paymentMethod']>('Pay after service');
  const [promo, setPromo] = useState<CheckoutDetails['promoCode']>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + index + 1);
    return {
      id: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
      label: day.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  }), []);
  const selectedDate = dates.find((item) => item.id === date)?.label;
  const resultDate = request.checkout
    ? new Date(`${request.checkout.scheduledDate}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
    : selectedDate;
  const discount = promo === 'GIGA10' ? Math.round(service.price * 0.1) : 0;
  const total = service.price - discount;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom + 14;

  async function placeRequest() {
    if (!date || !time || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onPlace({ scheduledDate: date, timeSlot: time, paymentMethod: payment, promoCode: promo });
    } catch {
      setError('Could not save your demo request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmChange() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'cancelConfirm') await onCancel();
      else if (mode === 'removeConfirm') await onRemove();
    } catch {
      setError('Could not update this request. Please try again; nothing has changed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      {mode === 'checkout' ? (
        <View style={styles.overlay}>
          <Pressable accessibilityLabel="Close checkout" style={[StyleSheet.absoluteFill, { backgroundColor: colors.modalScrim }]} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: bottom }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Checkout</Text>
              <IconButton icon="x" accessibilityLabel="Close checkout" onPress={onClose} />
            </View>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={[styles.serviceSummary, { backgroundColor: colors.accent }]}>
                <View style={[styles.serviceIcon, { backgroundColor: colors.card }]}>
                  <Feather name="home" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.serviceName, { color: colors.foreground }]}>{service.title}</Text>
                  <Text style={[styles.summaryHint, { color: colors.mutedForeground }]}>{service.provider} · Demo listing</Text>
                </View>
                <Text style={[styles.summaryPrice, { color: colors.foreground }]}>{formatCheckoutPrice(service.price)}</Text>
              </View>

              <Pressable accessibilityRole="button" onPress={() => setSection(section === 'schedule' ? null : 'schedule')} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.categoryBlue }]}><Feather name="calendar" size={17} color={colors.primary} /></View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Time</Text>
                <Text numberOfLines={1} style={[styles.rowValue, { color: date && time ? colors.foreground : colors.mutedForeground }]}>{date && time ? `${selectedDate} · ${time}` : 'Select date & time'}</Text>
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              </Pressable>
              {section === 'schedule' ? (
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>AVAILABLE DATES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChoices}>
                    {dates.map((item) => <Choice key={item.id} label={item.label} selected={date === item.id} onPress={() => { setDate(item.id); setError(''); }} />)}
                  </ScrollView>
                  <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>PREFERRED TIME</Text>
                  <View style={styles.timeChoices}>
                    {timeSlots.map((slot) => <Choice key={slot} label={slot} selected={time === slot} onPress={() => { setTime(slot); setError(''); }} />)}
                  </View>
                </View>
              ) : null}

              <Pressable accessibilityRole="button" onPress={() => setSection(section === 'payment' ? null : 'payment')} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.categoryLavender }]}><Feather name="credit-card" size={17} color={colors.primary} /></View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Payment</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{payment}</Text>
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              </Pressable>
              {section === 'payment' ? (
                <View style={styles.optionContent}>
                  {paymentOptions.map((option) => (
                    <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: payment === option }} onPress={() => { setPayment(option); setSection(null); }} style={styles.choiceLine}>
                      <Feather name={option === 'Demo card' ? 'credit-card' : 'clock'} size={17} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.choiceLineTitle, { color: colors.foreground }]}>{option}</Text>
                        <Text style={[styles.choiceLineHint, { color: colors.mutedForeground }]}>{option === 'Demo card' ? 'No card details or payment collected' : 'Arrange payment directly after service'}</Text>
                      </View>
                      <Feather name={payment === option ? 'check-circle' : 'circle'} size={19} color={payment === option ? colors.primary : colors.border} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable accessibilityRole="button" onPress={() => setSection(section === 'promo' ? null : 'promo')} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.categoryPeach }]}><Feather name="tag" size={17} color={colors.primary} /></View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Promo Code</Text>
                <Text style={[styles.rowValue, { color: promo ? colors.primary : colors.mutedForeground }]}>{promo ?? 'Pick discount'}</Text>
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              </Pressable>
              {section === 'promo' ? (
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>PREVIEW DISCOUNTS</Text>
                  <View style={styles.timeChoices}>
                    <Choice label="No discount" selected={!promo} onPress={() => { setPromo(null); setSection(null); }} />
                    <Choice label="GIGA10 · 10% off" selected={promo === 'GIGA10'} onPress={() => { setPromo('GIGA10'); setSection(null); }} />
                  </View>
                </View>
              ) : null}

              {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            </ScrollView>
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              {discount > 0 ? <View style={styles.costLine}><Text style={[styles.costLabel, { color: colors.primary }]}>GIGA10 demo discount</Text><Text style={[styles.costValue, { color: colors.primary }]}>−{formatCheckoutPrice(discount)}</Text></View> : null}
              <View style={[styles.costLine, styles.totalLine]}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total cost</Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatCheckoutPrice(total)}</Text>
              </View>
              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Demo checkout only. No card charged or provider contacted. Prices and availability are sample values.</Text>
              <ActionButton label={submitting ? 'Saving request…' : 'Place service'} disabled={!date || !time || submitting} onPress={() => { void placeRequest(); }} />
            </View>
          </View>
        </View>
      ) : mode === 'success' ? (
        <View style={[styles.resultScreen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14, paddingBottom: bottom }]}>
          <View style={styles.resultClose}><IconButton icon="x" accessibilityLabel="Close confirmation" onPress={onClose} /></View>
          <View style={styles.resultCenter}>
            <View style={[styles.resultHalo, { backgroundColor: colors.accent }]}>
              <View style={[styles.resultCircle, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={50} color={colors.primaryForeground} />
              </View>
            </View>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Your demo request{'\n'}has been placed</Text>
            <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>Saved on this device for preview. No provider has accepted it and no payment was taken.</Text>
            <View style={[styles.resultSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={17} color={colors.primary} />
              <Text style={[styles.resultSummaryText, { color: colors.foreground }]}>{service.title} · {resultDate} at {request.checkout?.timeSlot ?? time}{'\n'}{formatCheckoutPrice(request.checkout?.total ?? total)} · {request.checkout?.paymentMethod ?? payment}</Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <ActionButton label="View request" onPress={onClose} />
            <ActionButton label="Back to Home" secondary onPress={onBackHome} />
          </View>
        </View>
      ) : mode === 'cancelConfirm' || mode === 'removeConfirm' ? (
        <View style={[styles.cancelBackdrop, { backgroundColor: colors.modalScrim }]}>
          <View style={[styles.cancelCard, { backgroundColor: colors.card }]}>
            <View style={styles.cancelClose}><IconButton icon="x" accessibilityLabel="Keep request" onPress={onClose} /></View>
            <View style={[styles.cancelIcon, { backgroundColor: colors.categoryPink }]}><Feather name="alert-circle" size={38} color={colors.destructive} /></View>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>{mode === 'cancelConfirm' ? 'Cancel this request?' : 'Remove this request?'}</Text>
            <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>
              {mode === 'cancelConfirm'
                ? 'Your demo schedule and total will stay in Requests, marked as cancelled.'
                : 'This will permanently remove the demo request from this device. It cannot be undone.'}
            </Text>
            {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive, marginTop: 12 }]}>{error}</Text> : null}
            <ActionButton
              label={submitting ? 'Updating…' : mode === 'cancelConfirm' ? 'Cancel demo request' : 'Remove request'}
              disabled={submitting}
              onPress={() => { void confirmChange(); }}
              style={[styles.cancelAction, { backgroundColor: colors.destructive, borderColor: colors.destructive }]}
            />
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.backHome}><Text style={[styles.backHomeText, { color: colors.foreground }]}>Keep request</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.cancelBackdrop, { backgroundColor: colors.modalScrim }]}>
          <View style={[styles.cancelCard, { backgroundColor: colors.card }]}>
            <View style={styles.cancelClose}><IconButton icon="x" accessibilityLabel="Close cancellation" onPress={onClose} /></View>
            <View style={[styles.cancelIcon, { backgroundColor: colors.categoryPink }]}><Feather name="x" size={34} color={colors.destructive} /></View>
            <Text style={[styles.resultTitle, { color: colors.destructive }]}>Request cancelled</Text>
            <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>This demo request has been cancelled on your device. No provider was contacted or charged.</Text>
            <ActionButton label="View requests" onPress={onClose} style={styles.cancelAction} />
            <Pressable accessibilityRole="button" onPress={onBackHome} style={styles.backHome}><Text style={[styles.backHomeText, { color: colors.primary }]}>Back to Home</Text></Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', overflow: 'hidden' },
  sheetScroll: { flexShrink: 1 },
  sheetHeader: { height: 58, paddingLeft: 21, paddingRight: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 10 },
  serviceSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, marginBottom: 14 },
  serviceIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 13, fontWeight: '800' },
  summaryHint: { fontSize: 10, marginTop: 3 },
  summaryPrice: { fontSize: 12, fontWeight: '800' },
  optionRow: { minHeight: 62, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 12, fontWeight: '700' },
  rowValue: { flex: 1, textAlign: 'right', fontSize: 11, fontWeight: '600' },
  optionContent: { paddingTop: 13, paddingBottom: 12, gap: 11 },
  optionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  dateChoices: { gap: 8, paddingRight: 8 },
  timeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 37, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, justifyContent: 'center' },
  choiceLabel: { fontSize: 11, fontWeight: '700' },
  choiceLine: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 11 },
  choiceLineTitle: { fontSize: 12, fontWeight: '700' },
  choiceLineHint: { fontSize: 10, marginTop: 3 },
  costLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontSize: 11 },
  costValue: { fontSize: 12, fontWeight: '700' },
  totalLine: { marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  disclaimer: { fontSize: 10, lineHeight: 14, marginTop: 7, marginBottom: 10 },
  error: { fontSize: 11, lineHeight: 16, marginBottom: 7 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1 },
  resultScreen: { flex: 1, paddingHorizontal: 28 },
  resultClose: { alignSelf: 'flex-end' },
  resultCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultHalo: { width: 142, height: 142, borderRadius: 71, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  resultCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  resultMessage: { fontSize: 12, lineHeight: 19, textAlign: 'center', maxWidth: 280, marginTop: 10 },
  resultSummary: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 15, borderWidth: 1, marginTop: 23 },
  resultSummaryText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
  resultActions: { gap: 10 },
  cancelBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 23 },
  cancelCard: { borderRadius: 20, paddingHorizontal: 22, paddingBottom: 20, alignItems: 'center' },
  cancelClose: { alignSelf: 'flex-end', marginTop: 7, marginRight: -9 },
  cancelIcon: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  cancelAction: { alignSelf: 'stretch', marginTop: 25 },
  backHome: { paddingVertical: 14 },
  backHomeText: { fontSize: 12, fontWeight: '800' },
});