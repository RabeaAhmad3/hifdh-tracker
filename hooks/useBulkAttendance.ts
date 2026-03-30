import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ATTENDANCE_COLUMNS, ABSENCE_EXCUSE_COLUMNS } from '@/lib/constants';
import type { AttendanceStatus } from '@/lib/types';

interface BulkAttendanceEntry {
  status: AttendanceStatus | null;
  notes: string;
}

export interface Excuse {
  id: string;
  student_id: string;
  parent_id: string;
  date: string;
  reason: string;
  created_at: string;
  parent_name: string | null;
}

export function useBulkAttendance(date: string, teacherId: string) {
  const [entries, setEntries] = useState<Map<string, BulkAttendanceEntry>>(new Map());
  const [excuses, setExcuses] = useState<Map<string, Excuse>>(new Map());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExisting = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [attendanceResult, excuseResult] = await Promise.all([
        supabase
          .from('attendance')
          .select(ATTENDANCE_COLUMNS)
          .eq('date', date)
          .eq('teacher_id', teacherId)
          .limit(100),
        supabase
          .from('absence_excuses')
          .select(`${ABSENCE_EXCUSE_COLUMNS}, profiles!parent_id(full_name)`)
          .eq('date', date)
          .limit(100),
      ]);

      if (attendanceResult.error) {
        setError(attendanceResult.error.message);
        return;
      }

      const map = new Map<string, BulkAttendanceEntry>();
      for (const row of attendanceResult.data ?? []) {
        map.set(row.student_id, {
          status: row.status as AttendanceStatus,
          notes: row.notes ?? '',
        });
      }
      setEntries(map);

      if (!excuseResult.error) {
        const excuseMap = new Map<string, Excuse>();
        for (const row of excuseResult.data ?? []) {
          const profile = row.profiles as unknown as { full_name: string } | null;
          excuseMap.set(row.student_id, {
            id: row.id,
            student_id: row.student_id,
            parent_id: row.parent_id,
            date: row.date,
            reason: row.reason,
            created_at: row.created_at,
            parent_name: profile?.full_name ?? null,
          });
        }
        setExcuses(excuseMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load existing attendance');
    } finally {
      setLoading(false);
    }
  }, [date, teacherId]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const setEntry = useCallback((studentId: string, status: AttendanceStatus | null) => {
    setEntries((prev) => {
      const existing = prev.get(studentId);
      // Toggle off on re-tap
      const newStatus = existing?.status === status ? null : status;
      // No-op guards
      if (!existing && newStatus === null) return prev;
      if (existing && existing.status === newStatus) return prev;
      const next = new Map(prev);
      next.set(studentId, { status: newStatus, notes: existing?.notes ?? '' });
      return next;
    });
  }, []);

  const setNotes = useCallback((studentId: string, notes: string) => {
    setEntries((prev) => {
      const existing = prev.get(studentId);
      if (existing?.notes === notes) return prev;
      const next = new Map(prev);
      next.set(studentId, {
        status: existing?.status ?? null,
        notes,
      });
      return next;
    });
  }, []);

  const markAllPresent = useCallback((studentIds: string[]) => {
    setEntries((prev) => {
      const allAlreadyPresent = studentIds.every((id) => prev.get(id)?.status === 'present');
      if (allAlreadyPresent) return prev;
      const next = new Map(prev);
      for (const id of studentIds) {
        const existing = prev.get(id);
        next.set(id, { status: 'present', notes: existing?.notes ?? '' });
      }
      return next;
    });
  }, []);

  const saveAll = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      setSaving(true);

      const rows: {
        student_id: string;
        teacher_id: string;
        date: string;
        status: AttendanceStatus;
        notes: string | null;
      }[] = [];

      entries.forEach((entry, studentId) => {
        if (entry.status) {
          rows.push({
            student_id: studentId,
            teacher_id: teacherId,
            date,
            status: entry.status,
            notes: entry.notes.trim() || null,
          });
        }
      });

      if (rows.length === 0) {
        return { error: null };
      }

      const { error: upsertErr } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' });

      if (upsertErr) return { error: upsertErr.message };
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to save attendance',
      };
    } finally {
      setSaving(false);
    }
  }, [entries, teacherId, date]);

  return { entries, excuses, setEntry, setNotes, markAllPresent, saving, loading, error, saveAll };
}
