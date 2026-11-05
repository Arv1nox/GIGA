import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, FormField, IconButton, Page } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function VerifyScreen() {
  const colors = useColors();
  const { profile } = useMarketplace();
  const [code, setCode] = useState('');

  function continueToLocation() {
    if (code.length !== 4) {
      Alert.alert('Enter the 4-digit code', 'For this preview, any four digits will continue.');
      return;
    }
    router.replace('/(tabs)/shop');
  }

  return (
    <Page>
      <View style={styles.content}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={[styles.codeIcon, { backgroundColor: colors.accent }]}>
          <Feather name="message-circle" size={27} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Enter your 4 digit code</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>
          We sent a code to {profile.phone || 'your mobile number'}.
        </Text>
        <FormField
          label="Verification code"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))}
          placeholder="— — — —"
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel="Four digit verification code"
        />
        <Text style={[styles.demo, { color: colors.primary }]}>Preview mode: any four digits will work.</Text>
        <View style={styles.bottom}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Didn't get a code?</Text>
          <Pressable onPress={() => { setCode(''); Alert.alert('Preview code', 'Enter any four digits to continue in this prototype.'); }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}> Resend code</Text>
          </Pressable>
        </View>
        <ActionButton label="Continue" icon="arrow-right" onPress={continueToLocation} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 15 },
  codeIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  copy: { fontSize: 14, lineHeight: 20 },
  demo: { fontSize: 12, fontWeight: '700', marginTop: -6 },
  bottom: { flexDirection: 'row', marginTop: 'auto', marginBottom: 10 },
});