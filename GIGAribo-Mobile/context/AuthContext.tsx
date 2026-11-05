import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'customer' | 'provider';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  /** Who is signed in: a customer or a service provider. Null when signed out. */
  role: UserRole | null;
  isProvider: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true, role: null, isProvider: false });

/** The role is saved in Supabase user metadata at sign-up. Accounts made before roles existed count as customers. */
export function getRole(session: Session | null): UserRole | null {
  if (!session) return null;
  return session.user.user_metadata?.role === 'provider' ? 'provider' : 'customer';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    // Fires on sign in, sign out, token refresh, and expired sessions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });

    // Only refresh tokens while the app is in the foreground.
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      appStateSub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const value = useMemo(() => {
    const role = getRole(session);
    return { session, loading, role, isProvider: role === 'provider' };
  }, [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}