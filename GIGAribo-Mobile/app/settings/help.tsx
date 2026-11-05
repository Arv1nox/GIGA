import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton } from '@/components/MarketplaceUI';
import { SectionCard, SettingsPage } from '@/components/SettingsPage';

// TODO: replace with your real support email address.
const SUPPORT_EMAIL = 'support@example.com';

const faqs = [
  {
    question: 'How do I request a service?',
    answer: 'Browse Shop or Explore, open a service, and tap "Add to requests". Then open Requests to pick a date, time and payment option.',
  },
  {
    question: 'Do I need an account?',
    answer: 'You can browse as a guest. You need to sign in to check out.',
  },
  {
    question: 'Will I be charged?',
    answer: 'Not yet. Checkout in this preview is a demo: no card is charged and no provider is contacted.',
  },
  {
    question: 'How do I change my service area?',
    answer: 'Go to Account, then Address, and choose your area.',
  },
  {
    question: 'I forgot my password.',
    answer: 'Password recovery is not available in the app yet. Use "Contact support" below and we will help you.',
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactNote, setContactNote] = useState('');

  async function contactSupport() {
    setContactNote('');
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('GIGAribo help')}`);
    } catch {
      setContactNote(`We couldn't open your email app. Write to us at ${SUPPORT_EMAIL}.`);
    }
  }

  return (
    <SettingsPage title="Help">
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMMON QUESTIONS</Text>
      <SectionCard>
        {faqs.map((faq, index) => {
          const open = openIndex === index;
          return (
            <View
              key={faq.question}
              style={index < faqs.length - 1 && { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenIndex(open ? null : index)}
                style={styles.question}
              >
                <Text style={[styles.questionText, { color: colors.foreground }]}>{faq.question}</Text>
                <Feather name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.mutedForeground} />
              </Pressable>
              {open ? <Text style={[styles.answer, { color: colors.mutedForeground }]}>{faq.answer}</Text> : null}
            </View>
          );
        })}
      </SectionCard>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STILL NEED HELP?</Text>
      <SectionCard>
        <Text style={[styles.answer, { color: colors.mutedForeground, marginTop: 0 }]}>
          Send us a message at {SUPPORT_EMAIL} and we'll get back to you.
        </Text>
        {contactNote ? <Text accessibilityRole="alert" style={[styles.note, { color: colors.destructive }]}>{contactNote}</Text> : null}
        <ActionButton label="Contact support" icon="mail" onPress={() => { void contactSupport(); }} />
      </SectionCard>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 4 },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 28 },
  questionText: { flex: 1, fontSize: 13, fontWeight: '700' },
  answer: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  note: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
