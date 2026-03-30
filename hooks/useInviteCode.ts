import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { INVITE_CODE_COLUMNS } from '@/lib/constants';
import type { InviteCode } from '@/lib/types';

interface UseInviteCodeReturn {
  inviteCode: InviteCode | null;
  parentName: string | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  generate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInviteCode(studentId: string | null): UseInviteCodeReturn {
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('invite_codes')
        .select(INVITE_CODE_COLUMNS)
        .eq('student_id', studentId)
        .in('status', ['pending', 'used'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      if (!data) {
        setInviteCode(null);
        setParentName(null);
        return;
      }

      const code = data as InviteCode;

      // If pending, check expiry client-side
      if (code.status === 'pending' && new Date(code.expires_at) <= new Date()) {
        setInviteCode(null);
        setParentName(null);
        return;
      }

      setInviteCode(code);

      // If used, fetch parent name
      if (code.status === 'used' && code.used_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', code.used_by)
          .single();

        setParentName(profile?.full_name ?? null);
      } else {
        setParentName(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invite code');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const generate = useCallback(async () => {
    if (!studentId) return;

    setGenerating(true);
    setError(null);

    try {
      const { error: rpcErr } = await supabase.rpc('generate_invite_code', {
        p_student_id: studentId,
      });

      if (rpcErr) {
        setError(rpcErr.message);
        return;
      }

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  }, [studentId, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { inviteCode, parentName, loading, generating, error, generate, refresh };
}
