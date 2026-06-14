import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { formatAuthErrorMessage } from '../lib/authErrors';
import { isCloudEnabled } from '../lib/cloudConfig';
import { type OAuthProviderId, toSupabaseProvider } from '../lib/oauthProviders';
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
      if (sessionError) setError(formatAuthErrorMessage(sessionError));
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
      setError(formatAuthErrorMessage(signInError));
      throw signInError;
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProviderId) => {
    setError(null);
    const { error: oauthError } = await getSupabaseClient().auth.signInWithOAuth({
      provider: toSupabaseProvider(provider),
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (oauthError) {
      setError(formatAuthErrorMessage(oauthError));
      throw oauthError;
    }
  }, []);

  const registerPasskey = useCallback(async () => {
    setError(null);
    const { error: registerError } = await getSupabaseClient().auth.registerPasskey();
    if (registerError) {
      setError(formatAuthErrorMessage(registerError));
      throw registerError;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await getSupabaseClient().auth.signOut();
    if (signOutError) {
      setError(formatAuthErrorMessage(signOutError));
      throw signOutError;
    }
  }, []);

  return {
    session,
    loading,
    error,
    signInWithPasskey,
    signInWithOAuth,
    registerPasskey,
    signOut,
    cloudEnabled: isCloudEnabled(),
  };
}
