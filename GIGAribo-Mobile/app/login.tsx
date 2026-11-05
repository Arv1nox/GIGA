import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const colors = useColors();
  const { profile, updateProfile } = useMarketplace();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const hasRedirect = typeof redirect === 'string' && redirect.startsWith('/');

  async function signIn() {
    if (loading) return;
    if (!email.includes('@') || password.length < 1) {
      Alert.alert('Check your details', 'Enter a valid email and password to continue.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Could not sign in', error.message);
      return;
    }
    updateProfile({
      ...profile,
      // Use the full name entered at sign-up (saved in Supabase), falling back to the email prefix.
      name: profile.name === 'Guest'
        ? String(data.user?.user_metadata?.name ?? '').trim() || email.split('@')[0]
        : profile.name,
      email: data.user?.email ?? email.trim(),
    });
    const isProvider = data.user?.user_metadata?.role === 'provider';
    if (isProvider && !hasRedirect) {
      router.replace('/my-services'); // providers start on their services
    } else if (hasRedirect && router.canGoBack()) {
      router.back(); // return to the screen that sent them here
    } else {
      router.replace((hasRedirect ? redirect : '/(tabs)/shop') as Href);
    }
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={72}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={styles.logo}><BrandMark /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Sign in to pick up where you left off.</Text>
        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} submitBehavior="submit" />
        <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry inputRef={passwordRef} returnKeyType="go" onSubmitEditing={signIn} />
        <Pressable onPress={() => Alert.alert('Password reset', 'Password recovery is not connected yet.')} style={styles.forgot}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Forgot password?</Text>
        </Pressable>
        <ActionButton label={loading ? 'Signing in...' : 'Sign in'} onPress={signIn} disabled={loading} />
        <View style={styles.bottom}>
          <View style={styles.signup}>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/register')}><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}> Sign up</Text></Pressable>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 23, paddingTop: 9, paddingBottom: 24, gap: 16 },
  logo: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  copy: { fontSize: 13, marginTop: -10 },
  forgot: { alignSelf: 'flex-end', marginTop: -8 },
  bottom: { marginTop: 'auto', gap: 14 },
  signup: { flexDirection: 'row', justifyContent: 'center' },
});