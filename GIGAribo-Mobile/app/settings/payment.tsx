import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SectionCard, SettingsPage } from '@/components/SettingsPage';

type Method = {
  title: string;
  hint: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  badge: 'Available' | 'Preview' | 'Coming soon';
};

const methods: Method[] = [
  { title: 'Pay after service', hint: 'Arrange payment directly with the provider once the job is done.', icon: 'clock', badge: 'Available' },
  { title: 'Demo card', hint: 'Try the checkout flow. No card details are collected or charged.', icon: 'credit-card', badge: 'Preview' },
  { title: 'GCash / Maya', hint: 'E-wallet payments will be added when the service goes live.', icon: 'smartphone', badge: 'Coming soon' },
  { title: 'Credit or debit card', hint: 'Secure card payments will be added when the service goes live.', icon: 'lock', badge: 'Coming soon' },
];

export default function PaymentMethodsScreen() {
  const colors = useColors();

  return (
    <SettingsPage title="Payment methods">
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        You choose how to pay for each request at checkout. Here is what GIGAribo supports.
      </Text>
      <SectionCard>
        {methods.map((method, index) => {
          const available = method.badge === 'Available';
          return (
            <View
              key={method.title}
              style={[styles.row, index < methods.length - 1 && { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.icon, { backgroundColor: colors.accent }]}>
                <Feather name={method.icon} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>{method.title}</Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>{method.hint}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: available ? colors.accent : colors.muted }]}>
                <Text style={[styles.badgeText, { color: available ? colors.primary : colors.mutedForeground }]}>{method.badge}</Text>
              </View>
            </View>
          );
        })}
      </SectionCard>
      <View style={[styles.note, { backgroundColor: colors.accent }]}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.foreground }]}>
          This is a preview. No payment details are stored and nothing is charged.
        </Text>
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '800' },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
