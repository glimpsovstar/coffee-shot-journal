import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { isCloudEnabled } from '../lib/cloudConfig';
import { getSupabaseClient } from '../lib/supabaseClient';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isCloudEnabled());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloudEnabled()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithPasskey = useCallback(async () => {
    setError(null);
    const { error: signInError } = await getSupabaseClient().auth.signInWithPasskey();
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const registerPasskey = useCallback(async () => {
    setError(null);
    const { error: registerError } = await getSupabaseClient().auth.registerPasskey();
    if (registerError) {
      setError(registerError.message);
      throw registerError;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await getSupabaseClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
  }, []);

  return {
    session,
    loading,
    error,
    signInWithPasskey,
    registerPasskey,
    signOut,
    cloudEnabled: isCloudEnabled(),
  };
}
