import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { categories } from '@/constants/marketplace';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

/** Providers add a service customers can find and request. */
export default function AddServiceScreen() {
  const colors = useColors();
  const { session, isProvider, loading } = useAuth();
  const { addCustomService } = useMarketplace();
  const meta = session?.user.user_metadata ?? {};

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(String(meta.service_category ?? ''));
  const [price, setPrice] = useState('');
  const [area, setArea] = useState(String(meta.base_area ?? 'Naga City'));
  const [areas, setAreas] = useState('');
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

  async function saveService() {
    const cleanTitle = title.trim();
    const cleanSubtitle = subtitle.trim();
    const cleanArea = area.trim();
    const amount = Number(price.replace(/[^\d.]/g, ''));
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

    const businessName = String(meta.business_name ?? '').trim() || String(meta.name ?? '').trim();
    setIsSubmitting(true);
    try {
      await addCustomService(
        {
          title: cleanTitle,
          subtitle: cleanSubtitle || cleanTitle,
          category,
          price: Math.round(amount),
          area: cleanArea,
          serviceAreas: serviceAreas.length > 0 ? serviceAreas : [cleanArea],
        },
        { id: session.user.id, businessName, about: String(meta.about ?? ''), area: cleanArea }
      );
      Alert.alert('Service added', `"${cleanTitle}" is now listed for customers to find.`, [
        { text: 'OK', onPress: () => router.replace('/my-services') },
      ]);
    } catch (error) {
      Alert.alert('Could not add service', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={72}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        <View style={styles.logo}><BrandMark /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Add a service</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Tell customers what you offer and where.</Text>

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

        <ActionButton label={isSubmitting ? 'Adding service...' : 'Add service'} icon="plus" onPress={saveService} disabled={isSubmitting} />
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
});