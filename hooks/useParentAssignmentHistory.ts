import { useCallback, useEffect, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toDateString, ASSIGNMENT_COLUMNS } from '@/lib/constants';
import type { Assignment, AssignmentCategory } from '@/lib/types';

export interface DateGroup {
  date: string;
  displayDate: string;
  assignments: Assignment[];
}

export interface ParentAssignmentHistoryData {
  groups: DateGroup[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useParentAssignmentHistory(
  studentId: string | null,
  weekAnchorDate: Date,
  categoryFilter?: AssignmentCategory,
): ParentAssignmentHistoryData {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use timestamp for stable dependency comparison (Date objects use reference equality)
  const anchorTime = weekAnchorDate.getTime();

  const fetchHistory = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);

      const anchor = new Date(anchorTime);
      const weekStart = toDateString(startOfWeek(anchor, { weekStartsOn: 0 }));
      const weekEnd = toDateString(endOfWeek(anchor, { weekStartsOn: 0 }));

      let query = supabase
        .from('assignments')
        .select(ASSIGNMENT_COLUMNS)
        .eq('student_id', studentId)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: false })
        .order('category')
        .limit(50);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw new Error(queryError.message);

      // Group by date
      const grouped = new Map<string, Assignment[]>();
      for (const assignment of (data ?? []) as Assignment[]) {
        const existing = grouped.get(assignment.date);
        if (existing) {
          existing.push(assignment);
        } else {
          grouped.set(assignment.date, [assignment]);
        }
      }

      const result: DateGroup[] = [];
      for (const [date, assignments] of grouped) {
        result.push({
          date,
          displayDate: format(new Date(date + 'T00:00:00'), 'EEE, MMM d'),
          assignments,
        });
      }

      setGroups(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [studentId, anchorTime, categoryFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    groups,
    loading,
    error,
    refresh: fetchHistory,
  };
}
