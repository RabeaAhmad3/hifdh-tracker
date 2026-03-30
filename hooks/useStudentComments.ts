import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AssignmentCategory } from '@/lib/types';

export interface CommentEntry {
  date: string;
  category: AssignmentCategory;
  notes: string;
}

const PAGE_SIZE = 20;

export function useStudentComments(
  studentId: string | null,
  startDate: string,
  endDate: string,
) {
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!studentId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('assignments')
          .select('date, category, notes')
          .eq('student_id', studentId)
          .gte('date', startDate)
          .lte('date', endDate)
          .not('notes', 'is', null)
          .order('date', { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (error) throw new Error(error.message);

        const entries = (data ?? []) as CommentEntry[];
        setComments((prev) => (append ? [...prev, ...entries] : entries));
        setHasMore(entries.length === PAGE_SIZE);
      } catch {
        // Silently fail for comments — non-critical
      } finally {
        setLoading(false);
      }
    },
    [studentId, startDate, endDate],
  );

  useEffect(() => {
    setPage(0);
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    setPage((prev) => {
      const next = prev + 1;
      fetchPage(next, true);
      return next;
    });
  }, [fetchPage]);

  return { comments, loading, hasMore, loadMore };
}
