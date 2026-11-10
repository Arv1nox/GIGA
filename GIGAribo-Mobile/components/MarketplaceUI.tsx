import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { formatPrice, type Category, type Service } from '@/constants/marketplace';
import { ServiceArt, categoryPhotos, servicePhotos } from '@/components/ServiceArt';
import { FocusedPhoto, categoryFocus, serviceFocus } from '@/components/FocusedPhoto';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

/** A service's photo, cropped so the subject stays centered (falls back to the illustration). */
function ServicePhoto({ serviceId, imageUrl, style }: { serviceId: string; imageUrl?: string; style?: StyleProp<ViewStyle> }) {
  // A photo the provider added wins over the built-in illustration.
  if (imageUrl) {
    return (
      <View style={[{ overflow: 'hidden' }, style]}>
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  const photo = servicePhotos[serviceId];
  if (photo) return <FocusedPhoto source={photo} focus={serviceFocus[serviceId]} style={style} />;
  return <ServiceArt serviceId={serviceId} style={style} />;
}

export function Page({ children, tabbed = false, style }: { children: React.ReactNode; tabbed?: boolean; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const column = (
    <View
      style={[
        { flex: 1, backgroundColor: colors.background, paddingTop: isWeb ? 12 : insets.top, paddingBottom: isWeb && !tabbed ? 34 : 0 },
        // On wide web screens keep the content in a centered, phone-like column.
        isWeb ? { width: '100%', maxWidth: 560, alignSelf: 'center' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
  // On web, paint the full width with the app background so the sides of the column match the theme.
  if (isWeb) return <View style={{ flex: 1, width: '100%', backgroundColor: colors.background }}>{column}</View>;
  return column;
}

// Small square logo used next to the app name. Replace assets/images/logo-icon.png with your own.
const brandLogo = require('@/assets/images/logo-icon.png');

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  const size = compact ? 34 : 40;
  return (
    <View style={styles.brand}>
      <Image source={brandLogo} style={{ width: size, height: size, borderRadius: 12 }} resizeMode="contain" />
      <Text style={[styles.brandName, { color: colors.foreground, fontSize: compact ? 17 : 20 }]}>
        GIGA<Text style={{ color: colors.primary }}>ribo</Text>
      </Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: FeatherName;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.card : colors.navy,
          borderColor: secondary ? colors.border : colors.navy,
          opacity: disabled ? 0.45 : pressed ? 0.84 : 1,
        },
        secondary && styles.buttonSecondary,
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={17} color={secondary ? colors.foreground : '#FFFFFF'} /> : null}
      <Text style={[styles.buttonText, { color: secondary ? colors.foreground : '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  accessibilityLabel,
  size = 20,
  filled = false,
}: {
  icon: FeatherName;
  onPress: () => void;
  color?: string;
  accessibilityLabel: string;
  size?: number;
  /** Draws a white circle behind the icon so it stays visible on top of photos. */
  filled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        filled ? [styles.iconButtonFilled, { backgroundColor: colors.card }] : null,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name={icon} size={size} color={color ?? colors.foreground} />
    </Pressable>
  );
}

/** A solid heart when saved and an outline when not, with a small pop when it is tapped. */
export function HeartIcon({ active, size = 18, inactiveColor }: { active: boolean; size?: number; inactiveColor?: string }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 170, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [active, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? colors.destructive : inactiveColor ?? colors.navy}
      />
    </Animated.View>
  );
}

/** Round heart button used on service photos and rows. */
export function HeartButton({
  favorite,
  onPress,
  size = 20,
  filled = false,
  inactiveColor,
}: {
  favorite: boolean;
  onPress: () => void;
  size?: number;
  /** Draws a white circle behind the heart so it stays visible on top of photos. */
  filled?: boolean;
  inactiveColor?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorite ? 'Remove from favourites' : 'Add to favourites'}
      accessibilityState={{ selected: favorite }}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        filled ? [styles.iconButtonFilled, { backgroundColor: colors.card }] : null,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <HeartIcon active={favorite} size={size} inactiveColor={inactiveColor} />
    </Pressable>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search services',
  onSubmitEditing,
  onClear,
}: Pick<TextInputProps, 'value' | 'onChangeText' | 'onSubmitEditing'> & { placeholder?: string; onClear?: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.searchField, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        style={[styles.searchInput, { color: colors.foreground }]}
      />
      {value && onClear ? (
        <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="Clear search">
          <Feather name="x-circle" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[styles.linkText, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoryTile({
  category,
  onPress,
  selected = false,
  width = 108,
}: {
  category: Category;
  onPress: () => void;
  selected?: boolean;
  width?: ViewStyle['width'];
}) {
  const colors = useColors();
  const tone = colors[category.tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.categoryTile,
        { width, backgroundColor: tone, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {categoryPhotos[category.id] ? (
        <FocusedPhoto source={categoryPhotos[category.id]} focus={categoryFocus[category.id]} style={styles.categoryPhoto} />
      ) : (
        <View style={[styles.categoryIcon, { backgroundColor: colors.card }]}>
          <Feather name={category.icon as FeatherName} size={25} color={colors.navy} />
        </View>
      )}
      <Text numberOfLines={2} style={[styles.categoryText, { color: colors.foreground }]}>{category.title}</Text>
    </Pressable>
  );
}

export function ServiceImage({
  service,
  style,
  imageStyle,
}: {
  service: Service;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}) {
  return (
    <ServicePhoto
      serviceId={service.id}
      imageUrl={service.imageUrl}
      style={[styles.serviceImage, style, imageStyle as StyleProp<ViewStyle>]}
    />
  );
}

export function ServiceCard({
  service,
  favorite,
  onPress,
  onToggleFavorite,
  width = 176,
}: {
  service: Service;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  width?: ViewStyle['width'];
}) {
  const colors = useColors();
  return (
    <View style={[styles.serviceCard, { width, backgroundColor: colors.card, borderColor: colors.border }]}>
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={onPress}>
          <ServicePhoto serviceId={service.id} imageUrl={service.imageUrl} style={styles.serviceCardImage} />
        </Pressable>
        {service.reviews >= 5 && service.rating >= 4.9 ? (
          <View style={[styles.topBadge, { backgroundColor: colors.card }]} pointerEvents="none">
            <Feather name="award" size={10} color="#F3A64C" />
            <Text style={[styles.topBadgeText, { color: colors.foreground }]}>Top rated</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Remove from favourites' : 'Add to favourites'}
          onPress={onToggleFavorite}
          hitSlop={6}
          style={[styles.heartButton, { backgroundColor: colors.card }]}
        >
          <HeartIcon active={favorite} size={17} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={onPress} style={({ pressed }) => [styles.serviceCardBody, { opacity: pressed ? 0.8 : 1 }]}>
        <Text numberOfLines={1} style={[styles.serviceTitle, { color: colors.foreground }]}>{service.title}</Text>
        <Text numberOfLines={1} style={[styles.serviceSubtitle, { color: colors.mutedForeground }]}>{service.provider}</Text>
        <View style={styles.serviceMeta}>
          <Text style={[styles.servicePrice, { color: colors.foreground }]}>{formatPrice(service.price)}</Text>
          <View style={styles.rating}>
            <Feather name="star" size={12} color="#F3A64C" />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>{service.reviews > 0 ? service.rating.toFixed(1) : 'New'}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function ServiceRow({
  service,
  favorite,
  onPress,
  onToggleFavorite,
}: {
  service: Service;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={onPress}>
        <ServicePhoto serviceId={service.id} imageUrl={service.imageUrl} style={styles.serviceRowImage} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.title}`} onPress={onPress} style={styles.serviceRowCopy}>
        <Text numberOfLines={1} style={[styles.serviceTitle, { color: colors.foreground }]}>{service.title}</Text>
        <Text numberOfLines={1} style={[styles.serviceSubtitle, { color: colors.mutedForeground }]}>{service.provider}</Text>
        <View style={styles.serviceMeta}>
          <Text style={[styles.servicePrice, { color: colors.foreground }]}>{formatPrice(service.price)}</Text>
          <View style={styles.rating}>
            <Feather name="star" size={12} color="#F3A64C" />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>{service.reviews > 0 ? service.rating.toFixed(1) : 'New'}</Text>
          </View>
        </View>
      </Pressable>
      <HeartButton favorite={favorite} onPress={onToggleFavorite} inactiveColor={colors.mutedForeground} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
}: {
  icon: FeatherName;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>{message}</Text>
      {action && onAction ? <ActionButton label={action} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export function FormField({
  label,
  style,
  inputRef,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; style?: StyleProp<ViewStyle>; inputRef?: React.Ref<TextInput> }) {
  const colors = useColors();
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;
  return (
    <View style={[{ gap: 7 }, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.fieldWrap}>
        <TextInput
          ref={inputRef}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isPassword && hidden}
          style={[
            styles.fieldInput,
            { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            isPassword && styles.fieldInputWithToggle,
          ]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.fieldToggle}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ServiceGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.serviceGrid}>{children}</View>;
}

export function HorizontalServices({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 22 }}>
      {children}
    </ScrollView>
  );
}

export const uiStyles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 26 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: '800', letterSpacing: -0.8 },
  button: { minHeight: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonSecondary: { borderWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  iconButtonFilled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#0E1838',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  searchField: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 10 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.35 },
  linkText: { fontSize: 12, fontWeight: '700' },
  categoryTile: { minHeight: 118, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1 },
  categoryIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryPhoto: { width: 56, height: 56, borderRadius: 18 },
  categoryText: { fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'center' },
  serviceImage: { minHeight: 160, justifyContent: 'flex-end' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  serviceCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#162B63',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceCardImage: { width: '100%', aspectRatio: 4 / 3 },
  topBadge: { position: 'absolute', left: 8, top: 8, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10 },
  topBadgeText: { fontSize: 9, fontWeight: '800' },
  heartButton: { position: 'absolute', right: 9, top: 9, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  serviceCardBody: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  serviceTitle: { fontSize: 14, fontWeight: '700' },
  serviceSubtitle: { fontSize: 11, marginTop: 3 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  servicePrice: { fontSize: 13, fontWeight: '800' },
  rating: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  ratingText: { fontSize: 11, fontWeight: '600' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#162B63',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  serviceRowImage: { width: 84, height: 84, borderRadius: 16 },
  serviceRowCopy: { flex: 1, minWidth: 0 },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 44, gap: 10 },
  emptyIcon: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  fieldWrap: { justifyContent: 'center' },
  fieldInput: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  fieldInputWithToggle: { paddingRight: 48 },
  fieldToggle: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, alignItems: 'center', justifyContent: 'center' },
});