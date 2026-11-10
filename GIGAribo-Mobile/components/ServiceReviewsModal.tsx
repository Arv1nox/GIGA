import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IconButton } from '@/components/MarketplaceUI';
import { fetchServiceReviews, type ServiceReview } from '@/lib/remoteRatings';

type Props = {
  serviceId: string;
  serviceTitle: string;
  rating: number;
  reviews: number;
  /** False for built-in sample listings, which have no customer reviews. */
  hasReviews: boolean;
  onClose: () => void;
};

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color="#F3A64C" />
      ))}
    </View>
  );
}

/** Pop-up listing who rated a service and what they wrote. */
export function ServiceReviewsModal({ serviceId, serviceTitle, rating, reviews, hasReviews, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<ServiceReview[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasReviews) return;
    let active = true;
    fetchServiceReviews(serviceId)
      .then((rows) => {
        if (active) setList(rows);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [serviceId, hasReviews]);

  const bottom = Platform.OS === 'web' ? 24 : insets.bottom + 14;

  return (
    <Modal visible transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close reviews" style={[StyleSheet.absoluteFill, { backgroundColor: colors.modalScrim }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: bottom }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>Ratings & reviews</Text>
              <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{serviceTitle}</Text>
            </View>
            <IconButton icon="x" accessibilityLabel="Close reviews" onPress={onClose} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {!hasReviews ? (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>This is a sample listing, so its rating is for preview only. Reviews appear on services added by local providers.</Text>
            ) : failed ? (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>Could not load reviews. Check your connection and try again.</Text>
            ) : list === null ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
            ) : list.length === 0 ? (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>No ratings yet. Customers can rate this service once a booking is completed.</Text>
            ) : (
              <>
                <View style={[styles.summary, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.big, { color: colors.foreground }]}>{rating.toFixed(1)}</Text>
                  <View style={{ gap: 3 }}>
                    <Stars value={rating} size={16} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{reviews} {reviews === 1 ? 'rating' : 'ratings'}</Text>
                  </View>
                </View>
                {list.map((item) => (
                  <View key={item.id} style={[styles.review, { borderTopColor: colors.border }]}>
                    <View style={styles.reviewTop}>
                      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{item.customerName.trim().charAt(0).toUpperCase() || '?'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{item.customerName}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 1 }}>
                          {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <Stars value={item.stars} />
                    </View>
                    {item.comment ? <Text style={[styles.comment, { color: colors.foreground }]}>{item.comment}</Text> : null}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', width: '100%', maxWidth: 560, alignSelf: 'center', overflow: 'hidden' },
  header: { paddingLeft: 21, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 10 },
  empty: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginVertical: 24 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, marginBottom: 6 },
  big: { fontSize: 32, fontWeight: '800' },
  review: { borderTopWidth: 1, paddingVertical: 14, gap: 8 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  comment: { fontSize: 13, lineHeight: 19 },
});