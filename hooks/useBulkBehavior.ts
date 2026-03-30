import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BEHAVIOR_COLUMNS } from '@/lib/constants';
import type { BehaviorRating } from '@/lib/types';

interface BulkEntry {
  rating: BehaviorRating | null;
  notes: string;
}

export function useBulkBehavior(date: string, teacherId: string) {
  const [entries, setEntries] = useState<Map<string, BulkEntry>>(new Map());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing entries for the date
  const fetchExisting = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('behavior_logs')
        .select(BEHAVIOR_COLUMNS)
        .eq('date', date)
        .eq('teacher_id', teacherId)
        .limit(100);

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      const map = new Map<string, BulkEntry>();
      for (const row of data ?? []) {
        map.set(row.student_id, {
          rating: row.rating as BehaviorRating,
          notes: row.notes ?? '',
        });
      }
      setEntries(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing behavior');
    } finally {
      setLoading(false);
    }
  }, [date, teacherId]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const setEntry = useCallback(
    (studentId: string, rating: BehaviorRating | null, notes?: string) => {
      setEntries((prev) => {
        const existing = prev.get(studentId);
        const newRating = rating;
        const newNotes = notes ?? existing?.notes ?? '';
        // Same-value guard: skip if nothing changed
        if (existing && existing.rating === newRating && existing.notes === newNotes) {
          return prev;
        }
        const next = new Map(prev);
        next.set(studentId, { rating: newRating, notes: newNotes });
        return next;
      });
    },
    [],
  );

  const setNotes = useCallback((studentId: string, notes: string) => {
    setEntries((prev) => {
      const existing = prev.get(studentId);
      // Same-value guard
      if (existing?.notes === notes) return prev;
      const next = new Map(prev);
      next.set(studentId, {
        rating: existing?.rating ?? null,
        notes,
      });
      return next;
    });
  }, []);

  const saveAll = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      setSaving(true);

      // Filter entries with a rating set
      const rows: {
        student_id: string;
        teacher_id: string;
        date: string;
        rating: BehaviorRating;
        notes: string | null;
      }[] = [];

      entries.forEach((entry, studentId) => {
        if (entry.rating) {
          rows.push({
            student_id: studentId,
            teacher_id: teacherId,
            date,
            rating: entry.rating,
            notes: entry.notes.trim() || null,
          });
        }
      });

      if (rows.length === 0) {
        return { error: null };
      }

      const { error: upsertErr } = await supabase
        .from('behavior_logs')
        .upsert(rows, { onConflict: 'student_id,date' });

      if (upsertErr) return { error: upsertErr.message };
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to save behavior',
      };
    } finally {
      setSaving(false);
    }
  }, [entries, teacherId, date]);

  return { entries, setEntry, setNotes, saving, loading, error, saveAll };
}
