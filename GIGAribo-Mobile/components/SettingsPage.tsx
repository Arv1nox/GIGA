import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { IconButton, Page, uiStyles } from '@/components/MarketplaceUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

/** Shared frame for the Account sub-screens: back button, title, scrolling content. */
export function SettingsPage({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/account');
  }

  return (
    <Page>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={72}>
        <View style={styles.header}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        </View>
        {children}
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}

/** A rounded white card used to group related content. */
export function SectionCard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[uiStyles.card, styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

/** Inline success / error message. Works on web too (unlike Alert.alert). */
export function StatusText({ kind, message }: { kind: 'error' | 'success'; message: string }) {
  const colors = useColors();
  if (!message) return null;
  return (
    <Text
      accessibilityRole="alert"
      style={[styles.status, { color: kind === 'error' ? colors.destructive : colors.primary }]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 23, paddingTop: 9, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  card: { padding: 16, gap: 14 },
  status: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
