import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BEHAVIOR_COLUMNS, toDateString } from '@/lib/constants';
import type { BehaviorLog } from '@/lib/types';

export function useParentBehaviorHistory(
  studentId: string | null,
  year: number,
  month: number,
) {
  const [entries, setEntries] = useState<Map<string, BehaviorLog>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setEntries(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = toDateString(new Date(year, month, 1));
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = toDateString(new Date(year, month, lastDay));

      const { data, error: fetchErr } = await supabase
        .from('behavior_logs')
        .select(BEHAVIOR_COLUMNS)
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(31);

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      const byDate = new Map<string, BehaviorLog>();
      for (const row of data ?? []) {
        byDate.set(row.date, row as BehaviorLog);
      }

      setEntries(byDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch behavior history');
    } finally {
      setLoading(false);
    }
  }, [studentId, year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, error, refresh };
}
