import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { categories } from '@/constants/marketplace';
import { supabase } from '@/lib/supabase';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export default function RegisterProviderScreen() {
  const colors = useColors();
  const { updateProfile } = useMarketplace();

  const [business, setBusiness] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('Naga City');
  const [about, setAbout] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);

  async function createProviderAccount() {
    const cleanBusiness = business.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const cleanArea = area.trim();

    if (cleanBusiness.length < 2 || cleanName.length < 2) {
      Alert.alert('Review your details', 'Add your business or provider name and your own name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || password.length < 6) {
      Alert.alert('Review your details', 'Add a valid email and a password with at least 6 characters.');
      return;
    }
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      Alert.alert('Review your details', 'Add a mobile number customers can reach you on.');
      return;
    }
    if (!category) {
      Alert.alert('Choose a service', 'Pick the kind of service you want to provide.');
      return;
    }
    if (cleanArea.length < 2) {
      Alert.alert('Review your details', 'Add the place where you are based, for example Naga City.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            role: 'provider',
            business_name: cleanBusiness,
            service_category: category,
            base_area: cleanArea,
            phone: cleanPhone,
            about: about.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Registration failed', error.message);
        return;
      }

      // Email confirmation is required before the user can sign in.
      if (!data.session) {
        Alert.alert(
          'Verify your email',
          'Your provider account was created! Please check your email and verify it before signing in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }

      updateProfile({ name: cleanName, email: cleanEmail, phone: cleanPhone });
      Alert.alert(
        'Provider account created',
        'Next, add the services you offer so customers can find you.',
        [{ text: 'Add a service', onPress: () => router.replace('/add-service') }]
      );
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={72}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={styles.logo}><BrandMark /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Offer your service</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Create a provider account to reach customers around you.</Text>

        <FormField
          label="Business or provider name"
          value={business}
          onChangeText={setBusiness}
          placeholder="Bicol Roof Pros"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => nameRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Aldwin Dela Cruz"
          autoCapitalize="words"
          inputRef={nameRef}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          inputRef={emailRef}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          autoCapitalize="none"
          inputRef={passwordRef}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormField
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          placeholder="9XX XXX XXXX"
          keyboardType="phone-pad"
          maxLength={16}
          inputRef={phoneRef}
        />

        <View style={{ gap: 9 }}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>What service will you provide?</Text>
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
          label="Where are you based?"
          value={area}
          onChangeText={setArea}
          placeholder="Naga City"
          autoCapitalize="words"
          inputRef={areaRef}
          returnKeyType="next"
          submitBehavior="submit"
        />
        <FormField
          label="About your service (optional)"
          value={about}
          onChangeText={setAbout}
          placeholder="Tell customers what you offer"
          multiline
          numberOfLines={3}
          maxLength={240}
          textAlignVertical="top"
        />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Your account information is securely managed by Supabase.
        </Text>

        <ActionButton label={isSubmitting ? 'Creating account...' : 'Create provider account'} onPress={createProviderAccount} disabled={isSubmitting} />

        <View style={styles.signin}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Already have an account?</Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{' '}Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 23, paddingTop: 9, paddingBottom: 24, gap: 16 },
  logo: { alignItems: 'center', marginTop: 7, marginBottom: 4 },
  title: { fontSize: 25, fontWeight: '800' },
  copy: { fontSize: 13, marginTop: -10 },
  label: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: -6 },
  signin: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto' },
});