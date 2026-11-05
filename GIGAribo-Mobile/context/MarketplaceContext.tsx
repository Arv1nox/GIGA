import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  cancelRemoteBooking,
  fetchCustomerBookingStatuses,
  fetchProviderBookings,
  insertRemoteBooking,
  markRemoteBookingsSeen,
  setRemoteBookingStatus,
  subscribeToCustomerBookings,
  subscribeToProviderBookings,
  type Booking,
  type BookingStatus,
} from '@/lib/remoteBookings';
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
  /** Bookings customers made for the signed-in provider's services, newest first (empty for customers). */
  bookings: Booking[];
  /** Bookings the provider has not opened yet. */
  unseenBookingCount: number;
  /** Bookings still waiting for the provider to accept or decline. */
  pendingBookingCount: number;
  /** Set when a booking arrives while the app is open, so a popup can announce it. */
  bookingAlert: { id: string; customerName: string; serviceTitle: string } | null;
  /** Set when a provider answers one of the customer's bookings, so a popup can announce it. */
  requestAlert: { id: string; status: 'confirmed' | 'completed' | 'declined'; serviceTitle: string; provider: string } | null;
  refreshBookings: () => Promise<void>;
  markBookingsSeen: () => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
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

  const { session, isProvider } = useAuth();
  const sessionUser = session?.user.id ?? null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingAlert, setBookingAlert] = useState<MarketplaceContextValue['bookingAlert']>(null);
  const knownBookingIds = useRef<Set<string> | null>(null);
  const [requestAlert, setRequestAlert] = useState<MarketplaceContextValue['requestAlert']>(null);
  // Always the latest saved data, so background checks compare against what the screen shows.
  const stateRef = useRef(state);
  stateRef.current = state;

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

  // Providers: load bookings, then keep them fresh (live updates, every 30 seconds, and when the app comes back to the foreground).
  useEffect(() => {
    knownBookingIds.current = null;
    if (!isProvider || !sessionUser) {
      setBookings([]);
      return;
    }
    let active = true;
    const load = () => {
      fetchProviderBookings(sessionUser)
        .then((list) => {
          if (!active) return;
          const known = knownBookingIds.current;
          if (known) {
            const fresh = list.find((item) => !known.has(item.id) && item.status === 'new');
            if (fresh) setBookingAlert({ id: fresh.id, customerName: fresh.customerName, serviceTitle: fresh.serviceTitle });
          }
          knownBookingIds.current = new Set(list.map((item) => item.id));
          setBookings(list);
        })
        .catch(() => {});
    };
    load();
    let stopListening = () => {};
    try {
      stopListening = subscribeToProviderBookings(sessionUser, load);
    } catch {
      // live updates are optional; the timer below still picks up new bookings
    }
    const timer = setInterval(load, 30000);
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') load();
    });
    return () => {
      active = false;
      stopListening();
      clearInterval(timer);
      sub.remove();
    };
  }, [isProvider, sessionUser]);

  // Customers: when a provider answers a booking, update the matching request and tell the customer.
  useEffect(() => {
    if (!hydrated || !sessionUser) return;
    let active = true;
    const check = () => {
      fetchCustomerBookingStatuses(sessionUser)
        .then((remote) => {
          if (!active) return;
          const current = stateRef.current;
          const remoteStatus = new Map(remote.map((item) => [item.id, item.status]));
          let announce = null as MarketplaceContextValue['requestAlert'];
          let changed = false as boolean;
          const requests = current.requests.map((request) => {
            const answer = remoteStatus.get(request.id);
            if (!request.providerNotified || !answer || answer === (request.providerStatus ?? 'new')) return request;
            changed = true;
            if (answer === 'confirmed' || answer === 'completed' || answer === 'declined') {
              const service = getService(request.serviceId);
              // Tell them about the most important change: a fresh accept or decline beats a later "completed".
              if (!announce || answer !== 'completed') {
                announce = { id: `${request.id}-${answer}`, status: answer, serviceTitle: service?.title ?? 'your service', provider: service?.provider ?? 'The provider' };
              }
            }
            return { ...request, providerStatus: answer };
          });
          if (!changed) return;
          const next = { ...current, requests };
          stateRef.current = next;
          setState(next);
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          if (announce) setRequestAlert(announce);
        })
        .catch(() => {});
    };
    check();
    let stopListening = () => {};
    try {
      stopListening = subscribeToCustomerBookings(sessionUser, check);
    } catch {
      // live updates are optional; the timer below still picks up answers
    }
    const timer = setInterval(check, 30000);
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') check();
    });
    return () => {
      active = false;
      stopListening();
      clearInterval(timer);
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
    bookings,
    unseenBookingCount: bookings.filter((item) => !item.seen).length,
    pendingBookingCount: bookings.filter((item) => item.status === 'new').length,
    bookingAlert,
    requestAlert,
    refreshBookings: async () => {
      if (!sessionUser) return;
      try {
        const list = await fetchProviderBookings(sessionUser);
        knownBookingIds.current = new Set(list.map((item) => item.id));
        setBookings(list);
      } catch {
        // table not set up yet or offline: keep what we have
      }
    },
    markBookingsSeen: async () => {
      const ids = bookings.filter((item) => !item.seen).map((item) => item.id);
      if (ids.length === 0) return;
      setBookings((previous) => previous.map((item) => (ids.includes(item.id) ? { ...item, seen: true } : item)));
      try {
        await markRemoteBookingsSeen(ids);
      } catch {
        // harmless: they will show as new again next time
      }
    },
    updateBookingStatus: async (bookingId, status) => {
      const before = bookings;
      setBookings((previous) => previous.map((item) => (item.id === bookingId ? { ...item, status } : item)));
      try {
        await setRemoteBookingStatus(bookingId, status);
      } catch {
        setBookings(before);
        throw new Error('Could not update this booking. Check your connection and try again.');
      }
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
      // Tell the provider: send the booking to the shared database (only for services providers added in the app).
      let providerNotified = false;
      if (service.ownerId && session) {
        const meta = session.user.user_metadata ?? {};
        const savedName = state.profile.name && state.profile.name !== 'Guest' ? state.profile.name : '';
        try {
          await insertRemoteBooking({
            id: request.id,
            serviceId: service.id,
            serviceTitle: service.title,
            providerName: service.provider,
            ownerId: service.ownerId,
            customerName: savedName || String(meta.name ?? '').trim() || session.user.email || 'Customer',
            customerPhone: state.profile.phone || String(meta.phone ?? ''),
            serviceArea: request.serviceArea ?? service.area,
            scheduledDate: details.scheduledDate,
            timeSlot: details.timeSlot,
            paymentMethod: details.paymentMethod,
            promoCode: details.promoCode,
            total,
          });
          providerNotified = true;
        } catch {
          providerNotified = false;
        }
      }
      const next: MarketplaceState = {
        ...state,
        requests: state.requests.map((item) => item.id === requestId
          ? { ...item, status: 'Placed (demo)', checkout: { ...details, total }, providerNotified, providerStatus: providerNotified ? 'new' as const : undefined }
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
      if (request.providerNotified) {
        try {
          await cancelRemoteBooking(requestId);
        } catch {
          // the request is still cancelled on this device
        }
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
  }), [state, hydrated, bookings, bookingAlert, requestAlert, sessionUser, session]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const value = useContext(MarketplaceContext);
  if (!value) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return value;
}