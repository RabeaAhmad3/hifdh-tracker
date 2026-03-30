import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toDateString } from '@/lib/constants';
import type { ClassOverview } from '@/lib/types';

const EMPTY_OVERVIEW: ClassOverview = {
  today_attendance: { present: 0, total: 0 },
  students_without_assignments_today: [],
  weekly_pass_rates: { new_lesson: 0, previous_lesson: 0, revision: 0 },
  pending_excuses: 0,
};

export function useClassOverview() {
  const [overview, setOverview] = useState<ClassOverview>(EMPTY_OVERVIEW);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = toDateString(new Date());

      const [overviewRes, countRes] = await Promise.all([
        supabase.rpc('get_class_overview', { p_date: today }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
      ]);

      if (overviewRes.error) throw new Error(overviewRes.error.message);
      if (countRes.error) throw new Error(countRes.error.message);

      setOverview((overviewRes.data ?? EMPTY_OVERVIEW) as ClassOverview);
      setTotalStudents(countRes.count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, totalStudents, loading, error, refresh: fetchData };
}
