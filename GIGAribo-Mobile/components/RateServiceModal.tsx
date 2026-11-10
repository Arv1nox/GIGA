import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, IconButton } from '@/components/MarketplaceUI';

type Props = {
  serviceTitle: string;
  provider: string;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => Promise<void>;
};

const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Pop-up for rating the one service that was just completed (1 to 5 stars). */
export function RateServiceModal({ serviceTitle, provider, onClose, onSubmit }: Props) {
  const colors = useColors();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!stars || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(stars, comment);
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save your rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.modalScrim }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.close}><IconButton icon="x" accessibilityLabel="Close rating" onPress={onClose} /></View>
          <Text style={[styles.title, { color: colors.foreground }]}>Rate this service</Text>
          <Text numberOfLines={2} style={[styles.service, { color: colors.foreground }]}>{serviceTitle}</Text>
          <Text style={[styles.provider, { color: colors.mutedForeground }]}>{provider}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''}`} onPress={() => setStars(value)} hitSlop={4}>
                <Ionicons name={value <= stars ? 'star' : 'star-outline'} size={38} color="#F3A64C" />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{stars ? labels[stars - 1] : 'Tap a star'}</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Write a review (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            textAlignVertical="top"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          <Text style={[styles.counter, { color: colors.mutedForeground }]}>{comment.length}/500</Text>
          {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <ActionButton label={submitting ? 'Saving…' : 'Submit rating'} disabled={!stars || submitting} onPress={() => { void submit(); }} style={styles.submit} />
          <Text style={[styles.note, { color: colors.mutedForeground }]}>Your name and review are shown on this service.</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 23, paddingVertical: 24 },
  input: { alignSelf: 'stretch', minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 18, fontSize: 13 },
  counter: { alignSelf: 'flex-end', fontSize: 10, marginTop: 4 },
  card: { borderRadius: 20, paddingHorizontal: 22, paddingBottom: 20, paddingTop: 8, alignItems: 'center', width: '100%', maxWidth: 420, alignSelf: 'center' },
  close: { alignSelf: 'flex-end' },
  title: { fontSize: 20, fontWeight: '800' },
  service: { fontSize: 14, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  provider: { fontSize: 12, marginTop: 3 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 20 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 10, minHeight: 16 },
  error: { fontSize: 12, marginTop: 10, textAlign: 'center' },
  submit: { alignSelf: 'stretch', marginTop: 18 },
  note: { fontSize: 11, marginTop: 12 },
});