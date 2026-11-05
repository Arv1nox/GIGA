import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getService, type CheckoutDetails, type Profile, type ServiceRequest } from '@/constants/marketplace';
import { supabase } from '@/lib/supabase';

type MarketplaceState = {
  location: string;
  favorites: string[];
  requests: ServiceRequest[];
  profile: Profile;
  notificationsEnabled: boolean;
};

type MarketplaceContextValue = MarketplaceState & {
  hydrated: boolean;
  setLocation: (location: string) => void;
  toggleFavorite: (serviceId: string) => void;
  addRequest: (serviceId: string, serviceArea?: string) => Promise<void>;
  removeRequest: (requestId: string) => Promise<void>;
  checkoutRequest: (requestId: string, details: CheckoutDetails) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  updateProfile: (profile: Profile) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'gigaribo-prototype-v1';
const emptyProfile: Profile = { name: 'Guest', email: '', phone: '' };
const initialState: MarketplaceState = {
  location: 'Bagumbayan Sur, Naga City',
  favorites: [],
  requests: [],
  profile: emptyProfile,
  notificationsEnabled: true,
};

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketplaceState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const saved = JSON.parse(raw) as Partial<MarketplaceState>;
        const requests = Array.isArray(saved.requests)
          ? saved.requests.map((request) => ({
              ...request,
              // Older locally saved "Request sent" records were never delivered.
              status: request.status === 'Placed (demo)' && request.checkout
                ? 'Placed (demo)' as const
                : request.status === 'Cancelled (demo)'
                  ? 'Cancelled (demo)' as const
                  : 'Pending checkout' as const,
            }))
          : [];
        setState({ ...initialState, ...saved, requests });
      })
      .catch(() => {
        if (active) setState(initialState);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = (next: MarketplaceState) => {
    setState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<MarketplaceContextValue>(() => ({
    ...state,
    hydrated,
    setLocation: (location) => save({ ...state, location }),
    toggleFavorite: (serviceId) => {
      const favorites = state.favorites.includes(serviceId)
        ? state.favorites.filter((id) => id !== serviceId)
        : [...state.favorites, serviceId];
      save({ ...state, favorites });
    },
    addRequest: async (serviceId, serviceArea) => {
      if (!getService(serviceId)) throw new Error('Service not found.');
      const request: ServiceRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        serviceId,
        serviceArea,
        createdAt: new Date().toISOString(),
        status: 'Pending checkout',
      };
      const next = { ...state, requests: [request, ...state.requests] };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
    removeRequest: async (requestId) => {
      if (!state.requests.some((request) => request.id === requestId)) throw new Error('Request not found.');
      const next = { ...state, requests: state.requests.filter((request) => request.id !== requestId) };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
    checkoutRequest: async (requestId, details) => {
      const request = state.requests.find((item) => item.id === requestId);
      const service = getService(request?.serviceId);
      if (!request || request.status !== 'Pending checkout' || !service) {
        throw new Error('This request is no longer available for checkout.');
      }
      const selected = new Date(`${details.scheduledDate}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const latest = new Date(today);
      latest.setDate(latest.getDate() + 7);
      latest.setHours(23, 59, 59, 999);
      if (Number.isNaN(selected.getTime()) || selected <= today || selected > latest ||
          !['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'].includes(details.timeSlot) ||
          !['Pay after service', 'Demo card'].includes(details.paymentMethod) ||
          (details.promoCode !== null && details.promoCode !== 'GIGA10')) {
        throw new Error('Choose a valid date, time, and payment preview.');
      }
      const total = details.promoCode === 'GIGA10' ? Math.round(service.price * 0.9) : service.price;
      const next: MarketplaceState = {
        ...state,
        requests: state.requests.map((item) => item.id === requestId
          ? { ...item, status: 'Placed (demo)', checkout: { ...details, total } }
          : item),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
    cancelRequest: async (requestId) => {
      const request = state.requests.find((item) => item.id === requestId);
      if (!request || request.status !== 'Placed (demo)') {
        throw new Error('Only placed demo requests can be cancelled.');
      }
      const next: MarketplaceState = {
        ...state,
        requests: state.requests.map((item) => item.id === requestId ? { ...item, status: 'Cancelled (demo)' } : item),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
    updateProfile: (profile) => save({ ...state, profile }),
    setNotificationsEnabled: (notificationsEnabled) => save({ ...state, notificationsEnabled }),
    signOut: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      const next = { ...state, profile: emptyProfile };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
  }), [state, hydrated]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const value = useContext(MarketplaceContext);
  if (!value) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return value;
}