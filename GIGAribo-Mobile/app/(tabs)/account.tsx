import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { ActionButton, Page, uiStyles } from '@/components/MarketplaceUI';

const menu: { label: string; icon: React.ComponentProps<typeof Feather>['name']; route: string }[] = [
  { label: 'Requests', icon: 'inbox', route: '/(tabs)/requests' },
  { label: 'My details', icon: 'user', route: '/settings/details' },
  { label: 'Address', icon: 'map-pin', route: '/location' },
  { label: 'Payment methods', icon: 'credit-card', route: '/settings/payment' },
  { label: 'Promo code', icon: 'tag', route: '/settings/promo' },
  { label: 'Help', icon: 'help-circle', route: '/settings/help' },
  { label: 'About', icon: 'info', route: '/settings/about' },
];

export default function AccountScreen() {
  const colors = useColors();
  const { profile, location, notificationsEnabled, setNotificationsEnabled, signOut } = useMarketplace();
  const { session, isProvider } = useAuth();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const signedIn = Boolean(session);
  const menuItems = isProvider
    ? [{ label: 'My services', icon: 'briefcase' as const, route: '/my-services' }, ...menu]
    : menu;
  // Prefer the saved profile name; otherwise use the full name entered at sign-up.
  const signupName = String(session?.user.user_metadata?.name ?? '').trim();
  const displayName = signedIn ? (profile.name && profile.name !== 'Guest' ? profile.name : signupName || profile.name) : 'Guest';
  const displayLine = signedIn
    ? profile.email || session?.user.email || profile.phone
    : 'Browsing as a guest';

  function handleSignOut() {
    setSignOutError('');
    setSignOutVisible(true);
  }

  async function confirmSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      setSignOutVisible(false);
      router.replace('/welcome');
    } catch {
      setSignOutError('Could not sign out right now. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Page tabbed>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[uiStyles.scrollContent, { paddingTop: 11, paddingBottom: 105 }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR GIGARIBO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}><Feather name="user" size={23} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text>
            {signedIn ? (
              <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
                <Feather name={isProvider ? 'briefcase' : 'user'} size={10} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{isProvider ? 'PROVIDER' : 'CUSTOMER'}</Text>
              </View>
            ) : null}
            <Text style={[styles.email, { color: colors.mutedForeground }]}>{displayLine}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={signedIn ? 'Edit my details' : 'Sign in'}
            hitSlop={10}
            onPress={() => router.push((signedIn ? '/settings/details' : '/login') as Href)}
          >
            <Feather name={signedIn ? 'edit-2' : 'log-in'} size={16} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.route as Href)}
              style={[styles.menuRow, index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Feather name={item.icon} size={17} color={colors.navy} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
            </Pressable>
          ))}
          <View style={styles.menuRow}>
            <Feather name="bell" size={17} color={colors.navy} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              accessibilityLabel="Notifications"
            />
          </View>
        </View>

        <View style={[styles.locationCard, { backgroundColor: colors.accent }]}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationLabel, { color: colors.mutedForeground }]}>SERVICE AREA</Text>
            <Text style={[styles.locationText, { color: colors.foreground }]}>{location}</Text>
          </View>
        </View>

        {signedIn ? (
          <ActionButton label="Log out" secondary icon="log-out" onPress={handleSignOut} style={{ marginTop: 17 }} />
        ) : (
          <View style={{ marginTop: 17, gap: 10 }}>
            <ActionButton label="Sign in" icon="log-in" onPress={() => router.push('/login')} />
            <ActionButton label="Create account" secondary onPress={() => router.push('/register')} />
          </View>
        )}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>GIGAribo · Local preview</Text>
      </ScrollView>
      <Modal
        visible={signOutVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => { if (!signingOut) setSignOutVisible(false); }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalScrim }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.accent }]}>
              <Feather name="log-out" size={21} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Sign out of this account?</Text>
            <Text style={[styles.modalCopy, { color: colors.mutedForeground }]}>
              Your profile details will be cleared from this device. Saved favourites and requests will stay.
            </Text>
            {signOutError ? <Text accessibilityRole="alert" style={[styles.modalError, { color: colors.destructive }]}>{signOutError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm sign out"
              testID="confirm-sign-out"
              disabled={signingOut}
              onPress={() => { void confirmSignOut(); }}
              style={({ pressed }) => [styles.signOutButton, { backgroundColor: colors.destructive, opacity: signingOut ? 0.55 : pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.signOutButtonText, { color: colors.destructiveForeground }]}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keep account"
              disabled={signingOut}
              onPress={() => setSignOutVisible(false)}
              style={styles.keepAccountButton}
            >
              <Text style={[styles.keepAccountText, { color: colors.foreground }]}>Keep account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4, marginTop: 4 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7, marginBottom: 17 },
  profileCard: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 23 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800' },
  email: { fontSize: 11, marginTop: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 9 },
  menuCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, overflow: 'hidden' },
  menuRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, padding: 14, marginTop: 17 },
  locationLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  locationText: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  version: { textAlign: 'center', fontSize: 10, marginTop: 17 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 24, padding: 22, alignItems: 'center' },
  modalIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  modalError: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  signOutButton: { width: '100%', minHeight: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  signOutButtonText: { fontSize: 14, fontWeight: '800' },
  keepAccountButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 5 },
  keepAccountText: { fontSize: 13, fontWeight: '700' },
});