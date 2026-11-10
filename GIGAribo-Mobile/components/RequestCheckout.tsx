import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ActionButton, IconButton } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { fetchTakenSlots } from '@/lib/remoteBookings';
import { formatCheckoutPrice, formatHour, getServiceSlots, getWorkingHours, type CheckoutDetails, type Service, type ServiceRequest } from '@/constants/marketplace';

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

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayId = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const parseId = (id: string) => ({ year: Number(id.slice(0, 4)), month: Number(id.slice(5, 7)) - 1, day: Number(id.slice(8, 10)) });

/** Month calendar. Only days from `min` to `max` can be picked. */
function Calendar({ selected, min, max, isFull, onSelect }: { selected: string | null; min: string; max: string; isFull: (id: string) => boolean; onSelect: (id: string) => void }) {
  const colors = useColors();
  const first = parseId(selected ?? min);
  const [shown, setShown] = useState({ year: first.year, month: first.month });
  const minParts = parseId(min);
  const maxParts = parseId(max);
  const monthIndex = (year: number, month: number) => year * 12 + month;
  const canGoBack = monthIndex(shown.year, shown.month) > monthIndex(minParts.year, minParts.month);
  const canGoForward = monthIndex(shown.year, shown.month) < monthIndex(maxParts.year, maxParts.month);
  const move = (step: number) => {
    const next = new Date(shown.year, shown.month + step, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  };
  const leading = new Date(shown.year, shown.month, 1).getDay();
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: leading }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  return (
    <View style={[calendarStyles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={calendarStyles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canGoBack} onPress={() => move(-1)} hitSlop={8} style={[calendarStyles.arrow, { opacity: canGoBack ? 1 : 0.3 }]}>
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[calendarStyles.monthTitle, { color: colors.foreground }]}>{monthNames[shown.month]} {shown.year}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={!canGoForward} onPress={() => move(1)} hitSlop={8} style={[calendarStyles.arrow, { opacity: canGoForward ? 1 : 0.3 }]}>
          <Feather name="chevron-right" size={18} color={colors.foreground} />
        </Pressable>
      </View>
      <View style={calendarStyles.week}>
        {weekdayLabels.map((label) => <Text key={label} style={[calendarStyles.weekday, { color: colors.mutedForeground }]}>{label}</Text>)}
      </View>
      <View style={calendarStyles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={`blank-${index}`} style={calendarStyles.cell} />;
          const id = dayId(shown.year, shown.month, day);
          const enabled = id >= min && id <= max && !isFull(id);
          const isSelected = selected === id;
          return (
            <View key={id} style={calendarStyles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !enabled }}
                accessibilityLabel={`${monthNames[shown.month]} ${day}`}
                disabled={!enabled}
                onPress={() => onSelect(id)}
                style={[calendarStyles.day, isSelected ? { backgroundColor: colors.primary } : enabled ? { backgroundColor: colors.accent } : null]}
              >
                <Text style={{ fontSize: 12, fontWeight: enabled ? '800' : '500', color: isSelected ? colors.primaryForeground : enabled ? colors.foreground : colors.border }}>{day}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 16, padding: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 14, fontWeight: '800' },
  week: { flexDirection: 'row' },
  weekday: { width: '14.2857%', textAlign: 'center', fontSize: 10, fontWeight: '700', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});

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
  // Bookings open from tomorrow up to about 3 months ahead.
  const range = useMemo(() => {
    const idFor = (offset: number) => {
      const day = new Date();
      day.setHours(12, 0, 0, 0);
      day.setDate(day.getDate() + offset);
      return dayId(day.getFullYear(), day.getMonth(), day.getDate());
    };
    return { min: idFor(1), max: idFor(90) };
  }, []);
  const selectedDate = date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : undefined;

  // Slots other customers already booked are reserved: nobody else can pick them until the provider declines or cancels.
  const { requests } = useMarketplace();
  const [remoteTaken, setRemoteTaken] = useState<{ date: string; slot: string }[]>([]);
  const loadTaken = () => {
    if (service.ownerId) void fetchTakenSlots(service.ownerId).then(setRemoteTaken).catch(() => {});
  };
  useEffect(() => {
    loadTaken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.ownerId]);
  const taken = useMemo(() => {
    const keys = new Set<string>();
    for (const item of remoteTaken) keys.add(`${item.date}|${item.slot}`);
    for (const item of requests) {
      if (item.id === request.id || item.serviceId !== service.id || item.status !== 'Placed (demo)' || !item.checkout) continue;
      if (item.providerStatus === 'declined' || item.providerStatus === 'cancelled') continue;
      keys.add(`${item.checkout.scheduledDate}|${item.checkout.timeSlot}`);
    }
    return keys;
  }, [remoteTaken, requests, service.id, request.id]);
  const isTaken = (day: string, slot: string) => taken.has(`${day}|${slot}`);
  // Only hours inside the provider's working hours can be booked.
  const timeSlots = useMemo(() => getServiceSlots(service), [service]);
  const hours = getWorkingHours(service);
  const isFullDay = (day: string) => timeSlots.every((slot) => isTaken(day, slot));
  const resultDate = request.checkout
    ? new Date(`${request.checkout.scheduledDate}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
    : selectedDate;
  const discount = promo === 'GIGA10' ? Math.round(service.price * 0.1) : 0;
  const total = service.price - discount;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom + 14;

  // After the request is placed, show the confirmation, then send the customer to the home screen.
  useEffect(() => {
    if (mode !== 'success') return;
    const timer = setTimeout(onBackHome, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function placeRequest() {
    if (!date || !time || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onPlace({ scheduledDate: date, timeSlot: time, paymentMethod: payment, promoCode: promo });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.startsWith('That time')) {
        // Someone else got that slot first: free the choice and refresh what is taken.
        setError(message);
        setTime(null);
        loadTaken();
      } else {
        setError('Could not save your demo request. Please try again.');
      }
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
    <Modal visible transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={mode === 'success' || mode === 'cancelled' ? onBackHome : onClose}>
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

              {request.serviceArea ? (
                <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.categoryGreen }]}><Feather name="map-pin" size={17} color={colors.primary} /></View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Location</Text>
                  <Text numberOfLines={1} style={[styles.rowValue, { color: colors.foreground }]}>{request.serviceArea}</Text>
                </View>
              ) : null}

              <Pressable accessibilityRole="button" onPress={() => setSection(section === 'schedule' ? null : 'schedule')} style={[styles.optionRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.categoryBlue }]}><Feather name="calendar" size={17} color={colors.primary} /></View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Time</Text>
                <Text numberOfLines={1} style={[styles.rowValue, { color: date && time ? colors.foreground : colors.mutedForeground }]}>{date && time ? `${selectedDate} · ${time}` : 'Select date & time'}</Text>
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              </Pressable>
              {section === 'schedule' ? (
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>PICK A DATE</Text>
                  <Calendar selected={date} min={range.min} max={range.max} isFull={isFullDay} onSelect={(id) => { setDate(id); if (time && isTaken(id, time)) setTime(null); setError(''); }} />
                  <Text style={[styles.calendarNote, { color: colors.mutedForeground }]}>Greyed-out days are fully booked or not open yet.</Text>
                  <Text style={[styles.calendarNote, { color: colors.mutedForeground }]}>Working hours: {formatHour(hours.start)} to {formatHour(hours.end)}</Text>
                  <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>{date ? `TIMES ON ${selectedDate?.toUpperCase()}` : 'PICK A DATE TO SEE TIMES'}</Text>
                  <View style={styles.schedule}>
                    {timeSlots.map((slot) => {
                      const reserved = date ? isTaken(date, slot) : false;
                      const chosen = time === slot;
                      const disabled = !date || reserved;
                      return (
                        <Pressable
                          key={slot}
                          accessibilityRole="button"
                          accessibilityState={{ selected: chosen, disabled }}
                          disabled={disabled}
                          onPress={() => { setTime(slot); setError(''); }}
                          style={[styles.slotRow, { backgroundColor: chosen ? colors.accent : colors.card, borderColor: chosen ? colors.primary : colors.border, opacity: disabled ? 0.5 : 1 }]}
                        >
                          <Text style={[styles.slotTime, { color: chosen ? colors.primary : colors.foreground }, reserved && { textDecorationLine: 'line-through' }]}>{slot}</Text>
                          <Text style={[styles.slotStatus, { color: reserved ? colors.destructive : chosen ? colors.primary : colors.mutedForeground }]}>{reserved ? 'Reserved' : chosen ? 'Selected' : 'Available'}</Text>
                        </Pressable>
                      );
                    })}
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
          <View style={styles.resultClose}><IconButton icon="x" accessibilityLabel="Close confirmation" onPress={onBackHome} /></View>
          <View style={styles.resultCenter}>
            <View style={[styles.resultHalo, { backgroundColor: colors.accent }]}>
              <View style={[styles.resultCircle, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={50} color={colors.primaryForeground} />
              </View>
            </View>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Your request{'\n'}has been placed</Text>
            <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>Please check Requests for confirmation. It stays under Pending until the provider accepts it. No payment was taken.</Text>
            <View style={[styles.resultSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={17} color={colors.primary} />
              <Text style={[styles.resultSummaryText, { color: colors.foreground }]}>{service.title}{request.serviceArea ? ` · ${request.serviceArea}` : ''}{'\n'}{resultDate} at {request.checkout?.timeSlot ?? time}{'\n'}{formatCheckoutPrice(request.checkout?.total ?? total)} · {request.checkout?.paymentMethod ?? payment}</Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <ActionButton label="Back to Home" onPress={onBackHome} />
            <ActionButton label="View my requests" secondary onPress={onClose} />
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
            <View style={styles.cancelClose}><IconButton icon="x" accessibilityLabel="Close cancellation" onPress={onBackHome} /></View>
            <View style={[styles.cancelIcon, { backgroundColor: colors.categoryPink }]}><Feather name="x" size={34} color={colors.destructive} /></View>
            <Text style={[styles.resultTitle, { color: colors.destructive }]}>Request cancelled</Text>
            <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>This demo request has been cancelled on your device. No provider was contacted or charged.</Text>
            <ActionButton label="Back to Home" onPress={onBackHome} style={styles.cancelAction} />
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
  calendarNote: { fontSize: 10, marginTop: 8 },
  schedule: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotRow: { width: '31.5%', minHeight: 54, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 2 },
  slotTime: { fontSize: 13, fontWeight: '700' },
  slotStatus: { fontSize: 10, fontWeight: '800' },
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