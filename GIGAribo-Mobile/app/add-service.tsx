import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { categories, DEFAULT_WORK_END, DEFAULT_WORK_START, formatHour, formatPrice, getWorkingHours } from '@/constants/marketplace';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const PRICE_IDEAS = [500, 850, 1200, 2000];
// Opening hours a provider can pick (24-hour clock). Closing is always later than opening.
const OPEN_HOURS = [5, 6, 7, 8, 9, 10, 11, 12];
const CLOSE_HOURS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

/** Providers add (or edit) a service customers can find and request. */
export default function AddServiceScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session, isProvider, loading } = useAuth();
  const { addCustomService, updateCustomService, customServices } = useMarketplace();
  const meta = session?.user.user_metadata ?? {};
  const editing = id ? customServices.find((item) => item.id === id && item.ownerId === session?.user.id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [subtitle, setSubtitle] = useState(editing && editing.subtitle !== editing.title ? editing.subtitle : '');
  const [category, setCategory] = useState(editing?.category ?? String(meta.service_category ?? ''));
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [area, setArea] = useState(editing?.area ?? String(meta.base_area ?? 'Naga City'));
  const [areas, setAreas] = useState(editing ? editing.serviceAreas.join(', ') : '');
  // Optional photo: starts as the saved one when editing. `imageChanged` is true once a new one is picked or it is removed.
  const [image, setImage] = useState<string | null>(editing?.imageUrl ?? null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const savedHours = getWorkingHours(editing);
  const [workStart, setWorkStart] = useState(editing ? savedHours.start : DEFAULT_WORK_START);
  const [workEnd, setWorkEnd] = useState(editing ? savedHours.end : DEFAULT_WORK_END);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subtitleRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);
  const areasRef = useRef<TextInput>(null);

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
          <Text style={[styles.copy, { color: colors.mutedForeground, marginTop: 0 }]}>
            Sign in with a provider account to add services. You can register one from the Get started page.
          </Text>
          <ActionButton label="Sign in" onPress={() => router.push('/login')} />
        </View>
      </Page>
    );
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });
      if (result.canceled || !result.assets[0]) return;
      setImage(result.assets[0].uri);
      setImageType(result.assets[0].mimeType ?? null);
      setImageChanged(true);
    } catch {
      Alert.alert('Could not open photos', 'Allow photo access in your settings and try again.');
    }
  }

  function removeImage() {
    setImage(null);
    setImageType(null);
    setImageChanged(true);
  }

  const amount = Number(price.replace(/[^\d.]/g, ''));
  const chosen = categories.find((item) => item.id === category);
  const businessName = String(meta.business_name ?? '').trim() || String(meta.name ?? '').trim();

  async function saveService() {
    const cleanTitle = title.trim();
    const cleanSubtitle = subtitle.trim();
    const cleanArea = area.trim();
    const serviceAreas = areas
      .split(',')
      .map((item) => item.trim())
      .filter((item, index, all) => item.length > 0 && all.indexOf(item) === index);

    if (cleanTitle.length < 3) {
      Alert.alert('Name your service', 'Give your service a short name, for example "Aircon cleaning".');
      return;
    }
    if (!category) {
      Alert.alert('Choose a category', 'Pick the category that fits this service best.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Add a price', 'Enter the starting price in pesos, for example 850.');
      return;
    }
    if (cleanArea.length < 2) {
      Alert.alert('Add your base area', 'Add the place where you are based, for example Naga City.');
      return;
    }
    if (!session || isSubmitting) return;

    const input = {
      title: cleanTitle,
      subtitle: cleanSubtitle || cleanTitle,
      category,
      price: Math.round(amount),
      area: cleanArea,
      serviceAreas: serviceAreas.length > 0 ? serviceAreas : [cleanArea],
      workStart,
      workEnd,
      // Only send the photo when it was added or changed (an untouched saved photo stays as it is).
      ...(!editing || imageChanged ? { image, imageType } : {}),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateCustomService(editing.id, input)
        : await addCustomService(input, { id: session.user.id, businessName, about: String(meta.about ?? '') });
      const photoNote = image && imageChanged && !/^https?:\/\//.test(('service' in result ? result.service.imageUrl : undefined) ?? '')
        ? ' The photo could not be uploaded, so only you can see it for now.'
        : '';
      const message = (result.synced
        ? editing
          ? `"${cleanTitle}" was updated for customers.`
          : `"${cleanTitle}" is now listed for customers to find.`
        : `"${cleanTitle}" was saved on this phone only. Customers can't see it until the shared services table is set up in Supabase (supabase/services.sql). You can share it later from My services.`) + photoNote;
      Alert.alert(editing ? 'Service updated' : 'Service added', message, [{ text: 'OK', onPress: () => router.replace('/my-services') }]);
    } catch (error) {
      Alert.alert('Could not save service', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={72}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.logo}><BrandMark /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>{editing ? 'Edit service' : 'Add a service'}</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Tell customers what you offer and where.</Text>

        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.previewIcon, { backgroundColor: colors.accent }]}>
            <Feather name={(chosen?.icon ?? 'briefcase') as FeatherName} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>HOW CUSTOMERS WILL SEE IT</Text>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{title.trim() || 'Your service name'}</Text>
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 12 }}>{businessName || 'Your business'} · {area.trim() || 'Your area'}</Text>
          </View>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{Number.isFinite(amount) && amount > 0 ? formatPrice(Math.round(amount)) : '₱—'}</Text>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Photo (optional)</Text>
          {image ? (
            <View style={[styles.photoBox, { borderColor: colors.border }]}>
              <Image source={{ uri: image }} style={styles.photo} resizeMode="cover" />
              <View style={styles.photoActions}>
                <Pressable accessibilityRole="button" onPress={() => void pickImage()} style={[styles.photoButton, { backgroundColor: colors.card }]}>
                  <Feather name="refresh-cw" size={13} color={colors.foreground} />
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>Change</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={removeImage} style={[styles.photoButton, { backgroundColor: colors.card }]}>
                  <Feather name="trash-2" size={13} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
              onPress={() => void pickImage()}
              style={[styles.photoEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="image" size={22} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>Add a photo</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Without one, a simple illustration is shown.</Text>
            </Pressable>
          )}
        </View>

        <FormField
          label="Service name"
          value={title}
          onChangeText={setTitle}
          placeholder="Aircon cleaning"
          autoCapitalize="sentences"
          returnKeyType="next"
          onSubmitEditing={() => subtitleRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Short description"
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Window and split-type units"
          inputRef={subtitleRef}
          returnKeyType="next"
          onSubmitEditing={() => priceRef.current?.focus()}
          submitBehavior="submit"
        />

        <View style={{ gap: 9 }}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.chips}>
            {categories.map((item) => {
              const selected = category === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, { backgroundColor: selected ? colors.accent : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <Feather name={item.icon as FeatherName} size={14} color={selected ? colors.primary : colors.mutedForeground} />
                  <Text style={{ color: selected ? colors.primary : colors.foreground, fontSize: 12, fontWeight: '700' }}>{item.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 9 }}>
          <FormField
            label="Starting price (₱)"
            value={price}
            onChangeText={setPrice}
            placeholder="850"
            keyboardType="number-pad"
            maxLength={7}
            inputRef={priceRef}
            returnKeyType="next"
            onSubmitEditing={() => areaRef.current?.focus()}
            submitBehavior="submit"
          />
          <View style={styles.chips}>
            {PRICE_IDEAS.map((idea) => (
              <Pressable
                key={idea}
                accessibilityRole="button"
                onPress={() => setPrice(String(idea))}
                style={[styles.priceChip, { backgroundColor: Number(price) === idea ? colors.accent : colors.card, borderColor: Number(price) === idea ? colors.primary : colors.border }]}
              >
                <Text style={{ color: Number(price) === idea ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{formatPrice(idea)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <FormField
          label="Where are you based?"
          value={area}
          onChangeText={setArea}
          placeholder="Naga City"
          autoCapitalize="words"
          inputRef={areaRef}
          returnKeyType="next"
          onSubmitEditing={() => areasRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Barangays or towns you cover"
          value={areas}
          onChangeText={setAreas}
          placeholder="Abella, Triangulo, Pili (separate with commas)"
          autoCapitalize="words"
          inputRef={areasRef}
          returnKeyType="go"
          onSubmitEditing={saveService}
        />

        <View style={{ gap: 9 }}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Working hours</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: -4 }}>
            Customers can only book times inside these hours. Open {formatHour(workStart)} to {formatHour(workEnd)}.
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>Opens</Text>
          <View style={styles.chips}>
            {OPEN_HOURS.map((hour) => (
              <Pressable
                key={`open-${hour}`}
                accessibilityRole="button"
                accessibilityState={{ selected: workStart === hour }}
                onPress={() => setWorkStart(hour)}
                style={[styles.priceChip, { backgroundColor: workStart === hour ? colors.accent : colors.card, borderColor: workStart === hour ? colors.primary : colors.border }]}
              >
                <Text style={{ color: workStart === hour ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{formatHour(hour)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>Closes</Text>
          <View style={styles.chips}>
            {CLOSE_HOURS.map((hour) => (
              <Pressable
                key={`close-${hour}`}
                accessibilityRole="button"
                accessibilityState={{ selected: workEnd === hour }}
                onPress={() => setWorkEnd(hour)}
                style={[styles.priceChip, { backgroundColor: workEnd === hour ? colors.accent : colors.card, borderColor: workEnd === hour ? colors.primary : colors.border }]}
              >
                <Text style={{ color: workEnd === hour ? colors.primary : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{formatHour(hour)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ActionButton
          label={isSubmitting ? 'Saving...' : editing ? 'Save changes' : 'Add service'}
          icon={editing ? 'check' : 'plus'}
          onPress={saveService}
          disabled={isSubmitting}
        />
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 23, paddingTop: 9, paddingBottom: 28, gap: 16 },
  gate: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 16 },
  logo: { alignItems: 'center', marginTop: 7, marginBottom: 4 },
  title: { fontSize: 25, fontWeight: '800' },
  copy: { fontSize: 13, marginTop: -10 },
  label: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  priceChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 22 },
  photoBox: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  photoActions: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 8 },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  previewIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});