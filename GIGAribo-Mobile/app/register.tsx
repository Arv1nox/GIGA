
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import {
  ActionButton,
  BrandMark,
  FormField,
  IconButton,
  Page,
} from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const colors = useColors();
  const { updateProfile } = useMarketplace();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createAccount() {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 6
    ) {
      Alert.alert(
        'Review your details',
        'Add your name, a valid email, and a password with at least 6 characters.'
      );
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
          'Your account was created! Please check your email and verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
        return;
      }

      updateProfile({
        name: cleanName,
        email: cleanEmail,
        phone: '',
      });

      router.replace('/location');
    } catch (error) {
      Alert.alert(
        'Something went wrong',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={72}
      >
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Back"
          onPress={() => router.back()}
        />

        <View style={styles.logo}>
          <BrandMark />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Create your account
        </Text>

        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          Your local service shortlist starts here.
        </Text>

        <FormField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Aldwin Dela Cruz"
          autoCapitalize="words"
        />

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
        />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Your account information is securely managed by Supabase.
        </Text>

        <ActionButton
          label={isSubmitting ? 'Creating account...' : 'Create account'}
          onPress={createAccount}
        />

        <View style={styles.signin}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            Already have an account?
          </Text>

          <Pressable onPress={() => router.replace('/login')}>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
              {' '}Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: 9,
    paddingBottom: 24,
    gap: 16,
  },
  logo: {
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 4,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
  },
  copy: {
    fontSize: 13,
    marginTop: -10,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: -6,
  },
  signin: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
});
