import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ABSENCE_EXCUSE_COLUMNS } from '@/lib/constants';
import type { AbsenceExcuse } from '@/lib/types';

export function useAbsenceExcuses(studentId: string | null, parentId: string | null) {
  const [excuses, setExcuses] = useState<AbsenceExcuse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const excusesByDate = useMemo(() => {
    const byDate = new Map<string, AbsenceExcuse>();
    for (const excuse of excuses) {
      byDate.set(excuse.date, excuse);
    }
    return byDate;
  }, [excuses]);

  const refresh = useCallback(async () => {
    if (!studentId || !parentId) {
      setExcuses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('absence_excuses')
        .select(ABSENCE_EXCUSE_COLUMNS)
        .eq('student_id', studentId)
        .eq('parent_id', parentId)
        .order('date', { ascending: false })
        .limit(100);

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      setExcuses((data ?? []) as AbsenceExcuse[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch excuses');
    } finally {
      setLoading(false);
    }
  }, [studentId, parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitExcuse = useCallback(
    async (date: string, reason: string): Promise<{ error: string | null }> => {
      if (!studentId || !parentId) return { error: 'Missing student or parent' };

      try {
        setSubmitting(true);

        const { error: insertErr } = await supabase
          .from('absence_excuses')
          .insert({
            student_id: studentId,
            parent_id: parentId,
            date,
            reason: reason.trim(),
          });

        if (insertErr) return { error: insertErr.message };

        await refresh();
        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to submit excuse',
        };
      } finally {
        setSubmitting(false);
      }
    },
    [studentId, parentId, refresh],
  );

  return { excusesByDate, submitExcuse, submitting, loading, error };
}
