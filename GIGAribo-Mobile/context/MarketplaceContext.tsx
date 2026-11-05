import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import {
  getAllServices,
  getService,
  setCustomMarketplace,
  type CheckoutDetails,
  type Profile,
  type Service,
  type ServiceRequest,
} from '@/constants/marketplace';
import { useAuth } from '@/context/AuthContext';
import { deleteRemoteService, fetchRemoteServices, insertRemoteService, updateRemoteService, uploadServiceImage } from '@/lib/remoteServices';
import { supabase } from '@/lib/supabase';

type MarketplaceState = {
  location: string;
  favorites: string[];
  requests: ServiceRequest[];
  profile: Profile;
  notificationsEnabled: boolean;
  /** Services providers added from inside the app: shared ones from the database plus any saved only on this device. */
  customServices: Service[];
};

export type NewServiceInput = {
  title: string;
  subtitle: string;
  category: string;
  price: number;
  area: string;
  serviceAreas: string[];
  /** Optional photo: a file on this device (just picked) or an existing web URL. `null` removes it. */
  image?: string | null;
  /** Mime type of a freshly picked photo. */
  imageType?: string | null;
};

export type ProviderOwner = {
  id: string;
  businessName: string;
  about?: string;
};

type MarketplaceContextValue = MarketplaceState & {
  hydrated: boolean;
  /** Built-in sample services plus services providers added. */
  allServices: Service[];
  /** `synced` is false when the service could only be saved on this device (database not set up or offline). */
  addCustomService: (input: NewServiceInput, owner: ProviderOwner) => Promise<{ service: Service; synced: boolean }>;
  updateCustomService: (serviceId: string, changes: Partial<NewServiceInput> & { active?: boolean }) => Promise<{ synced: boolean }>;
  removeCustomService: (serviceId: string) => Promise<void>;
  /** Pulls the latest shared services so customers see what providers just added. */
  refreshServices: () => Promise<void>;
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
  customServices: [],
};

/** Turns a freshly picked photo into a shared web URL. If the upload fails the local file is kept so the provider still sees it. */
async function resolveImage(image: string | null | undefined, ownerId: string, mimeType?: string | null): Promise<string | undefined> {
  if (!image) return undefined;
  if (/^https?:\/\//.test(image)) return image;
  try {
    return await uploadServiceImage(image, ownerId, mimeType);
  } catch {
    return image;
  }
}

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
        setState({
          ...initialState,
          ...saved,
          requests,
          customServices: Array.isArray(saved.customServices) ? saved.customServices : [],
        });
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

  const { session } = useAuth();
  const sessionUser = session?.user.id ?? null;

  // Load shared services once the saved data is in, again when someone signs in or out, and when the app comes back to the foreground.
  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    const refresh = () => {
      fetchRemoteServices()
        .then((remote) => {
          if (!active) return;
          setState((previous) => {
            const remoteIds = new Set(remote.map((item) => item.id));
            const deviceOnly = previous.customServices.filter((item) => !item.synced && !remoteIds.has(item.id));
            const next = { ...previous, customServices: [...remote, ...deviceOnly] };
            void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        })
        .catch(() => {});
    };
    refresh();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [hydrated, sessionUser]);

  const save = (next: MarketplaceState) => {
    setState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Keep the lookup helpers in constants/marketplace.ts aware of services providers added.
  setCustomMarketplace(state.customServices);

  const value = useMemo<MarketplaceContextValue>(() => ({
    ...state,
    hydrated,
    allServices: getAllServices(),
    addCustomService: async (input, owner) => {
      const businessName = owner.businessName.trim();
      if (!businessName) throw new Error('Your provider profile needs a business name.');
      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service';
      const imageUrl = await resolveImage(input.image, owner.id, input.imageType);
      const service: Service = {
        id: `custom-${slug}-${Date.now().toString(36)}`,
        title: input.title,
        subtitle: input.subtitle,
        category: input.category,
        price: input.price,
        provider: businessName,
        providerAbout: owner.about?.trim() ?? '',
        rating: 0,
        reviews: 0,
        image: input.category === 'cleaning' ? 'cleaning' : 'repair',
        area: input.area,
        serviceAreas: input.serviceAreas,
        ownerId: owner.id,
        active: true,
        synced: false,
        imageUrl,
      };
      // Try the shared database first so every customer can see it; fall back to this device only.
      let synced = false;
      try {
        await insertRemoteService(service);
        synced = true;
      } catch {
        synced = false;
      }
      const saved: Service = { ...service, synced };
      const next: MarketplaceState = { ...state, customServices: [saved, ...state.customServices] };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
      return { service: saved, synced };
    },
    updateCustomService: async (serviceId, changes) => {
      const current = state.customServices.find((item) => item.id === serviceId);
      if (!current) throw new Error('Service not found.');
      const { image, imageType, ...fields } = changes;
      // Upload a newly picked photo; keep the current one unless the provider changed or removed it.
      const imageSource = 'image' in changes ? image : current.imageUrl;
      const imageUrl = await resolveImage(imageSource, current.ownerId ?? '', imageType);
      const updated: Service = { ...current, ...fields, imageUrl };
      let synced = Boolean(current.synced);
      if (current.synced) {
        try {
          await updateRemoteService(updated);
        } catch {
          throw new Error('Could not save your changes. Check your connection and try again.');
        }
      } else {
        // A service that only lives on this device may now be able to reach the database.
        try {
          await insertRemoteService(updated);
          synced = true;
        } catch {
          synced = false;
        }
      }
      const next: MarketplaceState = {
        ...state,
        customServices: state.customServices.map((item) => (item.id === serviceId ? { ...updated, synced } : item)),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
      return { synced };
    },
    removeCustomService: async (serviceId) => {
      const current = state.customServices.find((item) => item.id === serviceId);
      if (!current) throw new Error('Service not found.');
      if (current.synced) {
        try {
          await deleteRemoteService(serviceId);
        } catch {
          throw new Error('Could not remove this service. Check your connection and try again.');
        }
      }
      const next: MarketplaceState = {
        ...state,
        customServices: state.customServices.filter((item) => item.id !== serviceId),
        favorites: state.favorites.filter((id) => id !== serviceId),
        requests: state.requests.filter((request) => request.serviceId !== serviceId),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    },
    refreshServices: async () => {
      let remote: Service[];
      try {
        remote = await fetchRemoteServices();
      } catch {
        return; // database not set up yet or offline: keep what we have
      }
      setState((previous) => {
        const remoteIds = new Set(remote.map((item) => item.id));
        // Keep services that only live on this device; everything else comes from the database.
        const deviceOnly = previous.customServices.filter((item) => !item.synced && !remoteIds.has(item.id));
        const next = { ...previous, customServices: [...remote, ...deviceOnly] };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
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