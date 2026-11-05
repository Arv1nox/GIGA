import React, { useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { MarketplaceProvider } from '@/context/MarketplaceContext';
import { BookingAlerts } from '@/components/BookingAlerts';
import { useColors } from '@/hooks/useColors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back', contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ animation: 'fade', contentStyle: { backgroundColor: '#020B1F' } }} />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="signin" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-provider" />
      <Stack.Screen name="my-services" />
      <Stack.Screen name="add-service" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="location" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="service/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [visualAssetsLoaded, setVisualAssetsLoaded] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    let active = true;
    const images = [
      require('@/assets/images/cleaning-banner.jpg'),
      require('@/assets/images/repair-service.jpg'),
    ];
    const imageUris = images
      .map((image) => {
        if (typeof Image.resolveAssetSource === 'function') return Image.resolveAssetSource(image).uri;
        if (typeof image === 'string') return image;
        return typeof image?.uri === 'string' ? image.uri : null;
      })
      .filter((uri): uri is string => Boolean(uri));
    void Promise.all([
      Feather.loadFont(),
      ...imageUris.map((uri) => typeof Image.prefetch === 'function' ? Image.prefetch(uri) : Promise.resolve()),
    ])
      .catch(() => undefined)
      .finally(() => {
        if (active) setVisualAssetsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || ((fontsLoaded || fontError) && visualAssetsLoaded)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, visualAssetsLoaded]);

  if (Platform.OS !== 'web' && ((!fontsLoaded && !fontError) || !visualAssetsLoaded)) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AuthProvider>
                <MarketplaceProvider>
                  <StatusBar style="dark" />
                  <RootLayoutNav />
                  <BookingAlerts />
                </MarketplaceProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}