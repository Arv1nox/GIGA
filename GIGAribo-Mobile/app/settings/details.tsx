import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ActionButton, FormField } from '@/components/MarketplaceUI';
import { SectionCard, SettingsPage, StatusText } from '@/components/SettingsPage';
import { useAuth } from '@/context/AuthContext';
import { useMarketplace } from '@/context/MarketplaceContext';
import { supabase } from '@/lib/supabase';

type Status = { kind: 'error' | 'success'; message: string } | null;

export default function MyDetailsScreen() {
  const colors = useColors();
  const { session } = useAuth();

  if (!session) {
    return (
      <SettingsPage title="My details">
        <SectionCard>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            Sign in to view and edit your details.
          </Text>
          <ActionButton
            label="Sign in"
            icon="log-in"
            onPress={() => router.push({ pathname: '/login', params: { redirect: '/settings/details' } })}
          />
          <ActionButton label="Create account" secondary onPress={() => router.push('/register')} />
        </SectionCard>
      </SettingsPage>
    );
  }

  // The form is its own component so its fields start from the signed-in profile.
  return <DetailsForm email={session.user.email ?? ''} />;
}

function DetailsForm({ email }: { email: string }) {
  const colors = useColors();
  const { profile, updateProfile } = useMarketplace();

  const [name, setName] = useState(profile.name === 'Guest' ? '' : profile.name);
  const [phone, setPhone] = useState(profile.phone.replace(/^\+63\s?/, ''));
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsStatus, setDetailsStatus] = useState<Status>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);

  async function saveDetails() {
    setDetailsStatus(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setDetailsStatus({ kind: 'error', message: 'Enter your full name.' });
      return;
    }
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (phone.trim() && digits.length < 10) {
      setDetailsStatus({ kind: 'error', message: 'Enter a 10-digit Philippine mobile number, or leave it blank.' });
      return;
    }
    const formattedPhone = digits ? `+63 ${digits}` : '';

    setSavingDetails(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed, phone_number: formattedPhone },
    });
    setSavingDetails(false);
    if (error) {
      setDetailsStatus({ kind: 'error', message: error.message });
      return;
    }
    updateProfile({ ...profile, name: trimmed, phone: formattedPhone });
    // Saved: go back to the Account page.
    router.dismissTo('/(tabs)/account');
  }

  async function changePassword() {
    setPasswordStatus(null);
    if (newPassword.length < 8) {
      setPasswordStatus({ kind: 'error', message: 'Use at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ kind: 'error', message: 'The two passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordStatus({ kind: 'error', message: error.message });
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatus({ kind: 'success', message: 'Your password was updated.' });
  }

  return (
    <SettingsPage title="My details">
      <SectionCard>
        <FormField label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <FormField
          label="Mobile number (+63)"
          value={phone}
          onChangeText={setPhone}
          placeholder="9XX XXX XXXX"
          keyboardType="phone-pad"
          maxLength={13}
        />
        <FormField label="Email" value={email} editable={false} style={{ opacity: 0.7 }} />
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Your email is your login, so it can't be changed here yet.</Text>
        {detailsStatus ? <StatusText kind={detailsStatus.kind} message={detailsStatus.message} /> : null}
        <ActionButton label={savingDetails ? 'Saving...' : 'Save details'} onPress={() => { void saveDetails(); }} disabled={savingDetails} />
      </SectionCard>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHANGE PASSWORD</Text>
      <SectionCard>
        <FormField label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" />
        <FormField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Type it again" secureTextEntry autoCapitalize="none" />
        {passwordStatus ? <StatusText kind={passwordStatus.kind} message={passwordStatus.message} /> : null}
        <ActionButton label={savingPassword ? 'Updating...' : 'Update password'} secondary onPress={() => { void changePassword(); }} disabled={savingPassword} />
      </SectionCard>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  copy: { fontSize: 14, lineHeight: 21 },
  hint: { fontSize: 11, lineHeight: 16, marginTop: -6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 6 },
});