import { useEffect, useState } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { messageFromError } from './errors';
import { verifyOwner } from './api';

type OwnerState = {
  client: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  configured: boolean;
};

export function useOwnerSession(): OwnerState {
  const client = getSupabase();
  const [state, setState] = useState<OwnerState>({
    client,
    session: null,
    user: null,
    isOwner: false,
    loading: Boolean(client),
    error: null,
    configured: Boolean(client),
  });

  useEffect(() => {
    if (!client) return;
    let active = true;

    async function resolve(session: Session | null) {
      if (!active) return;
      if (!session) {
        setState((current) => ({
          ...current,
          session: null,
          user: null,
          isOwner: false,
          loading: false,
          error: null,
        }));
        return;
      }
      try {
        const isOwner = await verifyOwner(client!);
        if (active) {
          setState((current) => ({
            ...current,
            session,
            user: session.user,
            isOwner,
            loading: false,
            error: isOwner ? null : '로그인했지만 Dorami 운영자 권한이 없는 계정입니다.',
          }));
        }
      } catch (error) {
        if (active) {
          setState((current) => ({
            ...current,
            session,
            user: session.user,
            isOwner: false,
            loading: false,
            error: messageFromError(error),
          }));
        }
      }
    }

    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }));
        }
        return;
      }
      void resolve(data.session);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void resolve(session);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  return state;
}
