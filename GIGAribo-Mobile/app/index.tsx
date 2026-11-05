import React, { useEffect, useRef } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ActionButton, BrandMark, Page } from '@/components/MarketplaceUI';
import { useAuth } from '@/context/AuthContext';

const cover = require('@/assets/images/cleaning-banner.jpg');

export default function WelcomeScreen() {
  const colors = useColors();
  const { session, loading } = useAuth();
  const checked = useRef(false);

  // Skip the welcome screen once at startup if the person is already signed in.
  useEffect(() => {
    if (loading || checked.current) return;
    checked.current = true;
    if (session) router.replace('/(tabs)/shop');
  }, [loading, session]);

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <BrandMark />
          <Text style={[styles.tag, { color: colors.primary }]}>YOUR HOME, IN GOOD HANDS</Text>
        </View>

        <View style={styles.message}>
          <Text style={[styles.title, { color: colors.foreground }]}>Make home feel{'\n'}taken care of.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Find trusted local help for the little jobs, the big fixes, and everything in between.
          </Text>
        </View>

        <ImageBackground source={cover} imageStyle={styles.image} style={styles.hero}>
          <LinearGradient
            colors={['rgba(20,34,74,0)', 'rgba(20,34,74,0.80)']}
            style={styles.heroShade}
          >
            <Text style={styles.heroHeadline}>Good help is closer than you think.</Text>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.actions}>
          <ActionButton label="Get started" icon="arrow-right" onPress={() => router.push('/register')} />
          <Pressable onPress={() => router.replace('/(tabs)/shop')} style={styles.guestButton}>
            <Text style={[styles.guestText, { color: colors.primary }]}>Explore as a guest</Text>
          </Pressable>
        </View>
        <View style={styles.signInLine}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Already have an account?</Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 13 }}> Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 26, gap: 22 },
  top: { paddingTop: 10, gap: 19 },
  tag: { fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  message: { gap: 10 },
  title: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21, maxWidth: 320 },
  hero: { height: 250, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  image: { borderRadius: 24 },
  heroShade: { padding: 18, minHeight: 142, justifyContent: 'flex-end', gap: 8 },
  heroHeadline: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, fontWeight: '800', maxWidth: 250 },
  actions: { gap: 4 },
  guestButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  guestText: { fontWeight: '700', fontSize: 14 },
  signInLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
