import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, FormField } from '@/components/MarketplaceUI';
import { SectionCard, SettingsPage, StatusText } from '@/components/SettingsPage';

// Keep in sync with the promo codes accepted at checkout.
const offers = [{ code: 'GIGA10', description: '10% off your service total (demo)' }];

type Status = { kind: 'error' | 'success'; message: string } | null;

export default function PromoCodeScreen() {
  const colors = useColors();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>(null);

  function checkCode() {
    const entered = code.trim().toUpperCase();
    if (!entered) {
      setStatus({ kind: 'error', message: 'Enter a promo code.' });
      return;
    }
    const offer = offers.find((item) => item.code === entered);
    if (!offer) {
      setStatus({ kind: 'error', message: "That code isn't valid. Check the spelling and try again." });
      return;
    }
    setStatus({ kind: 'success', message: `${offer.code} is valid: ${offer.description}. Pick it under "Promo Code" at checkout.` });
  }

  return (
    <SettingsPage title="Promo code">
      <SectionCard>
        <FormField
          label="Have a code?"
          value={code}
          onChangeText={(value) => { setCode(value); setStatus(null); }}
          placeholder="Enter promo code"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {status ? <StatusText kind={status.kind} message={status.message} /> : null}
        <ActionButton label="Check code" onPress={checkCode} />
      </SectionCard>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AVAILABLE OFFERS</Text>
      <SectionCard>
        {offers.map((offer) => (
          <Pressable
            key={offer.code}
            accessibilityRole="button"
            accessibilityLabel={`Use code ${offer.code}`}
            onPress={() => { setCode(offer.code); setStatus(null); }}
            style={styles.offer}
          >
            <View style={[styles.offerIcon, { backgroundColor: colors.categoryPeach }]}>
              <Feather name="tag" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offerCode, { color: colors.foreground }]}>{offer.code}</Text>
              <Text style={[styles.offerText, { color: colors.mutedForeground }]}>{offer.description}</Text>
            </View>
            <Text style={[styles.use, { color: colors.primary }]}>Use</Text>
          </Pressable>
        ))}
      </SectionCard>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 6 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  offerCode: { fontSize: 13, fontWeight: '800' },
  offerText: { fontSize: 11, marginTop: 3 },
  use: { fontSize: 12, fontWeight: '800' },
});
