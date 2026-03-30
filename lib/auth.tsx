import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { type Profile } from '@/lib/types';
import { getCurrentPushToken, clearCachedPushToken } from '@/hooks/useNotifications';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<{ error: string | null }>;
  signUp(
    email: string,
    password: string,
    fullName: string,
    inviteCode: string
  ): Promise<{ error: string | null }>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string, retries = 2): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error && retries > 0) {
    await new Promise((r) => setTimeout(r, 500));
    return fetchProfile(userId, retries - 1);
  }

  if (error) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      const newUserId = newSession?.user?.id ?? null;
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setSession(newSession);
        if (newUserId) {
          fetchProfile(newUserId).then((p) => {
            if (!mounted) return;
            setProfile(p);
            setIsLoading(false);
          });
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    // Safety fallback: if onAuthStateChange INITIAL_SESSION hasn't resolved
    // loading within 5s, check getSession directly to avoid stuck splash screen
    const fallbackTimer = setTimeout(() => {
      if (!mounted || !isLoading) return;
      supabase.auth.getSession().then(({ data: { session: fallbackSession } }) => {
        if (!mounted) return;
        const userId = fallbackSession?.user?.id ?? null;
        if (userId && userId !== currentUserIdRef.current) {
          currentUserIdRef.current = userId;
          setSession(fallbackSession);
          fetchProfile(userId).then((p) => {
            if (!mounted) return;
            setProfile(p);
            setIsLoading(false);
          });
        } else if (!currentUserIdRef.current) {
          setIsLoading(false);
        }
      });
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    inviteCode: string
  ): Promise<{ error: string | null }> => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'parent', full_name: fullName },
      },
    });

    if (signUpError) return { error: signUpError.message };

    if (!data.session) {
      return { error: 'Please check your email to confirm your account.' };
    }

    const { error: rpcError } = await supabase.rpc('redeem_invite_code', {
      p_code: inviteCode.toUpperCase(),
    });

    if (rpcError) {
      // Note: signOut clears session but the auth.users row persists.
      // A future Edge Function could delete orphaned users. For now, RLS
      // blocks all data access without a parent_students link.
      await supabase.auth.signOut();
      const message = rpcError.message.includes('expired')
        ? 'This invite code has expired. Please ask your teacher for a new one.'
        : rpcError.message.includes('not found') || rpcError.message.includes('Invalid')
          ? 'Invalid invite code. Please check the code and try again.'
          : 'Could not redeem invite code. Please contact your teacher.';
      return { error: message };
    }

    return { error: null };
  }, []);

  const handleSignOut = useCallback(async () => {
    // Remove push token before signing out so device stops receiving notifications
    try {
      const token = await getCurrentPushToken();
      if (token) {
        await supabase.from('push_tokens').delete().eq('token', token);
      }
    } catch {
      // Non-critical — proceed with sign-out even if token cleanup fails
    }
    clearCachedPushToken();

    currentUserIdRef.current = null;
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signUp, signOut: handleSignOut }),
    [session, profile, isLoading, signIn, signUp, handleSignOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
