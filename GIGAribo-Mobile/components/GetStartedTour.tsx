import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { categories, formatPrice, getService, services } from '@/constants/marketplace';
import { ActionButton } from '@/components/MarketplaceUI';

const SEEN_KEY = 'gigaribo-tour-seen-v1';
const NATIVE = Platform.OS !== 'web';

type DemoKind = 'browse' | 'details' | 'add' | 'checkout' | 'favourite';
type Step = { icon: React.ComponentProps<typeof Feather>['name']; title: string; body: string; hint: string; demo: DemoKind };

// Edit these to change the tutorial.
const STEPS: Step[] = [
  {
    icon: 'search',
    title: 'Find the help you need',
    body: 'Pick a category on the home page or search for services like cleaning, plumbing and roofing.',
    hint: 'Try it: tap a category.',
    demo: 'browse',
  },
  {
    icon: 'info',
    title: 'Check the details',
    body: 'Open a service to see its price, ratings and provider before you decide.',
    hint: 'Try it: tap the card.',
    demo: 'details',
  },
  {
    icon: 'plus-circle',
    title: 'Add it to your requests',
    body: 'Tap "Add to requests". You come back to the home page with a confirmation.',
    hint: 'Try it: tap the button.',
    demo: 'add',
  },
  {
    icon: 'calendar',
    title: 'Pick a date and check out',
    body: 'In the Requests tab, choose a date and time and review your total.',
    hint: 'Try it: pick a time and apply GIGA10.',
    demo: 'checkout',
  },
  {
    icon: 'heart',
    title: 'Save your favourites',
    body: 'Tap the heart on any service to keep it in Favourites for later.',
    hint: 'Try it: tap the heart.',
    demo: 'favourite',
  },
];

/** Shows the tour automatically the first time, and lets the person reopen it any time. */
export function useGetStartedTour() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (!active || seen) return;
        // Small delay so it appears after the page has settled.
        timer = setTimeout(() => active && setOpen(true), 700);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => {
    setOpen(false);
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => undefined);
  }, []);

  return { open, show, close };
}

/** Small card for the home page that reopens the tour. */
export function GetStartedCard({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open the quick tour"
      style={[styles.card, { backgroundColor: colors.accent, borderColor: colors.border }]}
    >
      <View style={[styles.cardIcon, { backgroundColor: colors.primary }]}>
        <Feather name="compass" size={18} color={colors.primaryForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>New here? Take a quick tour</Text>
        <Text style={[styles.cardCopy, { color: colors.mutedForeground }]}>Try how booking works in 5 short steps.</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

/* ---------- Interactive examples (nothing here changes real data) ---------- */

const demoService = getService('house-cleaning') ?? services[0];

function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress: () => void; icon?: React.ComponentProps<typeof Feather>['name'] }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {icon ? <Feather name={icon} size={12} color={selected ? colors.primaryForeground : colors.primary} /> : null}
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function MiniCard({ onPress, right, children }: { onPress?: () => void; right?: React.ReactNode; children?: React.ReactNode }) {
  const colors = useColors();
  const Wrapper: React.ElementType = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.miniTop}>
        <View style={[styles.miniIcon, { backgroundColor: colors.accent }]}>
          <Feather name="home" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>{demoService.title}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{demoService.subtitle}</Text>
        </View>
        {right ?? <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>{formatPrice(demoService.price)}</Text>}
      </View>
      {children}
    </Wrapper>
  );
}

function BrowseDemo() {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = categories.find((c) => c.id === selected);
  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.searchMock, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Search for a service</Text>
      </View>
      <View style={styles.chipRow}>
        {categories.map((c) => (
          <Chip key={c.id} label={c.title} selected={selected === c.id} onPress={() => setSelected(c.id)} />
        ))}
      </View>
      <Text style={{ color: chosen ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
        {chosen
          ? `Showing ${chosen.title} services near Naga City`
          : 'Results appear here'}
      </Text>
    </View>
  );
}

function DetailsDemo() {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <MiniCard onPress={() => setOpen((v) => !v)}>
      {open ? (
        <View style={[styles.detailBox, { borderTopColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Feather name="star" size={13} color="#F3A64C" />
            <Text style={[styles.detailText, { color: colors.foreground }]}>
              {demoService.rating.toFixed(1)} ({demoService.reviews} reviews)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="user" size={13} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.foreground }]}>{demoService.provider}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={13} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.foreground }]}>Available near Naga City</Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 10 }}>Tap to see details</Text>
      )}
    </MiniCard>
  );
}

function AddDemo() {
  const colors = useColors();
  const [added, setAdded] = useState(false);
  return (
    <View style={{ gap: 10 }}>
      {added ? (
        <View style={[styles.miniToast, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toastIcon, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={13} color={colors.primaryForeground} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>Request added</Text>
        </View>
      ) : (
        <View style={styles.toastSpacer} />
      )}
      <MiniCard />
      <ActionButton
        label={added ? 'Added. Tap to try again' : 'Add to requests'}
        icon={added ? 'check' : undefined}
        secondary={added}
        onPress={() => setAdded((v) => !v)}
      />
    </View>
  );
}

function CheckoutDemo() {
  const colors = useColors();
  const dates = [1, 2, 3].map((n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric' });
  });
  const slots = ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'];
  const [date, setDate] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [promo, setPromo] = useState(false);
  const total = promo ? Math.round(demoService.price * 0.9) : demoService.price;
  return (
    <View style={{ gap: 9 }}>
      <View style={styles.chipRow}>
        {dates.map((label, i) => (
          <Chip key={label} label={label} icon="calendar" selected={date === i} onPress={() => setDate(i)} />
        ))}
      </View>
      <View style={styles.chipRow}>
        {slots.map((label, i) => (
          <Chip key={label} label={label} selected={slot === i} onPress={() => setSlot(i)} />
        ))}
      </View>
      <View style={[styles.totalRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Chip label="GIGA10" icon="tag" selected={promo} onPress={() => setPromo((v) => !v)} />
        <View style={{ flex: 1 }} />
        {promo ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, textDecorationLine: 'line-through' }}>{formatPrice(demoService.price)}</Text>
        ) : null}
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{formatPrice(total)}</Text>
      </View>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'center' }}>
        {slot === null ? 'Choose a time slot' : `Booked preview: ${dates[date]}, ${slots[slot]}`}
      </Text>
    </View>
  );
}

function FavouriteDemo() {
  const colors = useColors();
  const [fav, setFav] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const toggle = () => {
    setFav((v) => !v);
    scale.setValue(0.7);
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: NATIVE }).start();
  };
  return (
    <MiniCard
      right={
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Favourite" hitSlop={8}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <View style={[styles.heartBtn, { backgroundColor: colors.accent }]}>
              <Feather name="heart" size={18} color={fav ? colors.destructive : colors.navy} />
            </View>
          </Animated.View>
        </Pressable>
      }
    >
      <Text style={{ color: fav ? colors.primary : colors.mutedForeground, fontSize: 11, fontWeight: '700', marginTop: 10 }}>
        {fav ? 'Saved to Favourites' : 'Not saved yet'}
      </Text>
    </MiniCard>
  );
}

function Demo({ kind }: { kind: DemoKind }) {
  switch (kind) {
    case 'browse': return <BrowseDemo />;
    case 'details': return <DetailsDemo />;
    case 'add': return <AddDemo />;
    case 'checkout': return <CheckoutDemo />;
    case 'favourite': return <FavouriteDemo />;
  }
}

/* ---------- The tour popup ---------- */

export function GetStartedTour({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [index, setIndex] = useState(0);

  // Always start from the first step when it opens.
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Skip tour" hitSlop={10} style={styles.skip}>
            <Text style={{ color: colors.mutedForeground, fontWeight: '700', fontSize: 13 }}>Skip</Text>
          </Pressable>

          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
              <Feather name={step.icon} size={26} color={colors.primary} />
            </View>

            <Text style={[styles.count, { color: colors.primary }]}>STEP {index + 1} OF {STEPS.length}</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{step.body}</Text>

            <View style={[styles.demoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.hint, { color: colors.primary }]}>{step.hint}</Text>
              <Demo key={index} kind={step.demo} />
            </View>

            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === index ? { backgroundColor: colors.primary, width: 20 } : { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              {index > 0 ? (
                <ActionButton label="Back" secondary onPress={() => setIndex((i) => i - 1)} style={{ flex: 1 }} />
              ) : null}
              <ActionButton
                label={last ? 'Get started' : 'Next'}
                icon={last ? undefined : 'arrow-right'}
                onPress={() => (last ? onClose() : setIndex((i) => i + 1))}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 18, borderWidth: 1, marginBottom: 18 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardCopy: { fontSize: 12, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(2,11,31,0.6)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '94%', borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  sheetContent: { padding: 22, paddingTop: 28, alignItems: 'center' },
  skip: { position: 'absolute', top: 14, right: 18, zIndex: 5 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  count: { fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', marginTop: 6 },
  body: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, minHeight: 38 },

  demoBox: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 12, marginTop: 14, minHeight: 190, justifyContent: 'center' },
  hint: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center', marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 },
  searchMock: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, minHeight: 40 },

  miniCard: { borderWidth: 1, borderRadius: 16, padding: 12 },
  miniTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  detailBox: { borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 7 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, fontWeight: '600' },

  miniToast: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, padding: 8, alignSelf: 'center' },
  toastIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toastSpacer: { height: 40 },

  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 8 },
  heartBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  dots: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 16 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
});