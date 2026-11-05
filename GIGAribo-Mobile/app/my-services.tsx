import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ActionButton, EmptyState, IconButton, Page, uiStyles } from '@/components/MarketplaceUI';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { categories, formatPrice } from '@/constants/marketplace';

/** Provider home: the services this provider has added. */
export default function MyServicesScreen() {
  const colors = useColors();
  const { session, isProvider, loading } = useAuth();
  const { customServices, removeCustomService } = useMarketplace();
  const businessName = String(session?.user.user_metadata?.business_name ?? '').trim();
  const mine = customServices.filter((service) => service.ownerId === session?.user.id);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/account');
  };

  if (!loading && !isProvider) {
    return (
      <Page>
        <View style={styles.gate}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={() => router.replace('/(tabs)/shop')} />
          <Text style={[styles.title, { color: colors.foreground }]}>Provider accounts only</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            Sign in with a provider account to manage your services.
          </Text>
          <ActionButton label="Sign in" onPress={() => router.push('/login')} />
        </View>
      </Page>
    );
  }

  function confirmRemove(id: string, title: string) {
    Alert.alert('Remove service?', `"${title}" will no longer be listed for customers.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeCustomService(id).catch(() => Alert.alert('Could not remove', 'Please try again.'));
        },
      },
    ]);
  }

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 10, paddingBottom: 36 }]}>
        <View style={styles.header}>
          <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={goBack} />
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Feather name="briefcase" size={12} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>PROVIDER</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>My services</Text>
        {businessName ? <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>{businessName}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <ActionButton label="Add a service" icon="plus" onPress={() => router.push('/add-service')} />
        </View>

        {mine.length === 0 ? (
          <View style={{ marginTop: 18 }}>
            <EmptyState
              icon="briefcase"
              title="No services yet"
              message="Add your first service so customers nearby can find and request it."
              action="Add a service"
              onAction={() => router.push('/add-service')}
            />
          </View>
        ) : (
          <View style={{ marginTop: 18, gap: 12 }}>
            {mine.map((service) => {
              const category = categories.find((item) => item.id === service.category);
              return (
                <View key={service.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${service.title}`}
                    onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })}
                    style={{ flex: 1, gap: 3 }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>{service.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {category?.title ?? 'Service'} · from {formatPrice(service.price)}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }} numberOfLines={1}>
                      Covers {service.serviceAreas.join(', ')}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${service.title}`}
                    hitSlop={10}
                    onPress={() => confirmRemove(service.id, service.title)}
                  >
                    <Feather name="trash-2" size={18} color={colors.destructive} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 18, lineHeight: 16 }}>
          Preview note: services you add are saved on this device for now, so they show up in Explore here but are not shared with other phones yet.
        </Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, paddingHorizontal: 23, paddingTop: 9, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  title: { fontSize: 25, fontWeight: '800', marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
});