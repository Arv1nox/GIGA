import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function SignInScreen() {
  const colors = useColors();
  const { updateProfile, profile } = useMarketplace();
  const [phone, setPhone] = useState('');

  function continueWithPhone() {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length < 10) {
      Alert.alert('Check your number', 'Enter a 10-digit Philippine mobile number to continue.');
      return;
    }
    updateProfile({ ...profile, phone: `+63 ${cleaned}` });
    router.push('/verify');
  }

  function explainProvider() {
    Alert.alert('Preview only', 'Google and Apple sign-in are not connected in this prototype. Continue with a phone number or explore as a guest.');
  }

  return (
    <Page>
      <View style={styles.content}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={styles.brand}><BrandMark /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Get your household needs with GIGAribo</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>One good local service at a time.</Text>

        <FormField
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          placeholder="9XX XXX XXXX"
          keyboardType="phone-pad"
          maxLength={13}
          accessibilityLabel="Mobile number"
        />
        <View style={[styles.phonePrefix, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.foreground, fontSize: 14 }}>PH  +63</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Philippines</Text>
        </View>
        <ActionButton label="Continue with phone" onPress={continueWithPhone} icon="arrow-right" />

        <View style={styles.orRow}>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>or continue with</Text>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        <ActionButton label="Google" icon="globe" secondary onPress={explainProvider} />
        <ActionButton label="Apple" icon="smartphone" secondary onPress={explainProvider} />

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>New to GIGAribo?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}> Create account</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.replace('/(tabs)/shop')} style={styles.guest}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Continue as a guest</Text>
        </Pressable>
        <View style={[styles.lock, { backgroundColor: colors.accent }]}>
          <Feather name="lock" size={12} color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Preview only · authentication is not connected</Text>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 13 },
  brand: { alignItems: 'center', marginTop: 13, marginBottom: 8 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.4, maxWidth: 300 },
  subtitle: { fontSize: 13, marginTop: -7, marginBottom: 9 },
  phonePrefix: { minHeight: 47, paddingHorizontal: 13, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -3 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  rule: { height: 1, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 8 },
  guest: { alignItems: 'center', paddingVertical: 5 },
  lock: { flexDirection: 'row', gap: 7, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, marginTop: 3 },
});