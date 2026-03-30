import { useCallback, useEffect, useMemo, useState } from 'react';
import { subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { BEHAVIOR_COLUMNS, toDateString } from '@/lib/constants';
import type { BehaviorRating } from '@/lib/types';

export interface BehaviorHistoryEntry {
  date: string;
  rating: BehaviorRating;
  notes: string | null;
}

export function useBehaviorHistory(studentId: string | null, days = 30) {
  const [entries, setEntries] = useState<BehaviorHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, BehaviorHistoryEntry>();
    for (const entry of entries) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = toDateString(subDays(new Date(), days));

      const { data, error: fetchErr } = await supabase
        .from('behavior_logs')
        .select(BEHAVIOR_COLUMNS)
        .eq('student_id', studentId)
        .gte('date', startDate)
        .order('date', { ascending: false })
        .limit(days);

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      setEntries(
        (data ?? []).map((row) => ({
          date: row.date,
          rating: row.rating as BehaviorRating,
          notes: row.notes,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch behavior history');
    } finally {
      setLoading(false);
    }
  }, [studentId, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, entriesByDate, loading, error, refresh };
}
