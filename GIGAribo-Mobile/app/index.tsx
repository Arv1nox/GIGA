import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

// Native-driven animation isn't available on web (it only logs a warning there).
const NATIVE = Platform.OS !== 'web';

// Shortest time the loading screen stays up, so it never just flashes.
const MIN_DURATION_MS = 2200;

// Drop your logo picture in assets/images/ as logo.png (overwrite the placeholder) and it shows here.
const logo = require('@/assets/images/logo.png');

// Set to true if your logo picture does NOT already include the GIGAribo name + tagline.
const SHOW_TEXT = false;

// Dark, glowing look for the loading screen only.
const BG = '#020B1F';
const GLOW = '#1E7BFF';

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  const intro = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const leaving = useRef(new Animated.Value(1)).current;
  const minElapsed = useRef(false);
  const [ready, setReady] = React.useState(false);

  // Entrance, breathing logo and progress bar.
  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();

    // Fill most of the bar while loading; the rest is filled when we are ready to leave.
    Animated.timing(progress, {
      toValue: 0.85,
      duration: MIN_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      minElapsed.current = true;
      setReady(true);
    }, MIN_DURATION_MS);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [intro, pulse, progress]);

  // Leave once the minimum time has passed AND the saved session has been checked.
  const navigated = useRef(false);
  useEffect(() => {
    if (!ready || loading || navigated.current) return;
    navigated.current = true;
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(leaving, { toValue: 0, duration: 300, delay: 150, useNativeDriver: NATIVE }),
    ]).start(() => {
      router.replace(session ? '/(tabs)/shop' : '/welcome');
    });
  }, [ready, loading, session, progress, leaving]);

  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const rise = intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <Animated.View style={[styles.wrap, { opacity: Animated.multiply(intro, leaving) }]}>
        <Animated.View style={[styles.center, { transform: [{ translateY: rise }] }]}>
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
            <Animated.View style={[styles.logoShadow, { transform: [{ scale: logoScale }] }]}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </Animated.View>
          </View>

          {SHOW_TEXT ? (
            <>
              <Text style={styles.name}>
                GIGA<Text style={{ color: GLOW }}>ribo</Text>
              </Text>
              <Text style={styles.tag}>YOUR HOME, IN GOOD HANDS</Text>
            </>
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: barWidth }]} />
          </View>
          <Text style={styles.loadingText}>Getting things ready…</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: BG },
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  center: { alignItems: 'center', gap: 10 },
  logoWrap: { width: 300, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  halo: { position: 'absolute', width: 220, height: 160, borderRadius: 80, backgroundColor: GLOW },
  logoShadow: { width: 280, height: 200 },
  logo: { width: 280, height: 200 },
  name: { fontSize: 36, letterSpacing: -1.1, fontWeight: '800', color: '#FFFFFF' },
  tag: { fontSize: 10, letterSpacing: 2, fontWeight: '800', color: 'rgba(255,255,255,0.55)' },
  footer: { position: 'absolute', left: 56, right: 56, bottom: 64, alignItems: 'center', gap: 12 },
  track: { height: 5, borderRadius: 3, alignSelf: 'stretch', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)' },
  fill: { height: 5, borderRadius: 3, backgroundColor: GLOW },
  loadingText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
});