import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

// Native-driven animation isn't available on web (it only logs a warning there).
const NATIVE = Platform.OS !== 'web';

/**
 * A small popup that slides down from the top, stays for a moment, then hides itself.
 * Show it again by changing `trigger` to a new value (e.g. a timestamp). `null` keeps it hidden.
 */
export function Toast({
  trigger,
  title,
  detail,
  onPress,
  duration = 2600,
}: {
  trigger: string | null;
  title: string;
  detail?: string;
  onPress?: () => void;
  duration?: number;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (!trigger) return;
    setMounted(true);
    anim.setValue(0);
    let hideTimer: ReturnType<typeof setTimeout>;
    Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
    hideTimer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(() =>
        setMounted(false),
      );
    }, duration);
    return () => clearTimeout(hideTimer);
  }, [trigger, anim, duration]);

  if (!mounted) return null;

  const top = (Platform.OS === 'web' ? 67 : insets.top) + 8;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top, opacity: anim, transform: [{ translateY }] }]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={18} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {detail ? (
            <Text numberOfLines={1} style={[styles.detail, { color: colors.mutedForeground }]}>
              {detail}
            </Text>
          ) : null}
        </View>
        {onPress ? <Text style={[styles.view, { color: colors.primary }]}>View</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800' },
  detail: { fontSize: 12, marginTop: 2 },
  view: { fontSize: 13, fontWeight: '800' },
});