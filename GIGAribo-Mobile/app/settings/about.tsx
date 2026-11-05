import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { BrandMark } from '@/components/MarketplaceUI';
import { SectionCard, SettingsPage } from '@/components/SettingsPage';

export default function AboutScreen() {
  const colors = useColors();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SettingsPage title="About">
      <SectionCard>
        <BrandMark />
        <Text style={[styles.copy, { color: colors.foreground }]}>
          GIGAribo is a neighborhood-first way to find home services in the Philippines.
        </Text>
        <View style={[styles.versionRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Version</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{version}</Text>
        </View>
      </SectionCard>
      <View style={[styles.note, { backgroundColor: colors.accent }]}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.foreground }]}>
          This is a preview build. Services, providers and prices shown are sample data.
        </Text>
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  copy: { fontSize: 14, lineHeight: 21 },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1 },
  label: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: '800' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 15 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
