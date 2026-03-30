import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ATTENDANCE_COLUMNS, toDateString } from '@/lib/constants';
import type { Attendance } from '@/lib/types';

export function useParentAttendanceHistory(
  studentId: string | null,
  year: number,
  month: number,
) {
  const [entries, setEntries] = useState<Map<string, Attendance>>(new Map());
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
        .from('attendance')
        .select(ATTENDANCE_COLUMNS)
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(31);

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      const byDate = new Map<string, Attendance>();
      for (const row of data ?? []) {
        byDate.set(row.date, row as Attendance);
      }

      setEntries(byDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  }, [studentId, year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, error, refresh };
}
