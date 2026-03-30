import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';

export interface StudentWithStatus extends Student {
  hasAssignmentToday: boolean;
}

const STUDENT_COLUMNS =
  'id, full_name, arabic_name, current_surah, current_juz, notes, created_at, updated_at' as const;

export function useStudents() {
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch students and today's assignment status in parallel
      const [studentsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('students')
          .select(STUDENT_COLUMNS)
          .order('full_name'),
        supabase
          .from('assignments')
          .select('student_id')
          .eq('date', today),
      ]);

      if (studentsResult.error) {
        setError(studentsResult.error.message);
        setLoading(false);
        return;
      }

      // Build a set of student IDs that have assignments today
      const assignedStudentIds = new Set<string>();
      if (!assignmentsResult.error && assignmentsResult.data) {
        for (const row of assignmentsResult.data) {
          assignedStudentIds.add(row.student_id);
        }
      }

      const studentsWithStatus: StudentWithStatus[] = (
        studentsResult.data as Student[]
      ).map((s) => ({
        ...s,
        hasAssignmentToday: assignedStudentIds.has(s.id),
      }));

      setStudents(studentsWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Client-side search filtering by full_name
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter((s) => s.full_name.toLowerCase().includes(query));
  }, [students, searchQuery]);

  return {
    students: filteredStudents,
    loading,
    error,
    refresh: fetchStudents,
    searchQuery,
    setSearchQuery,
  };
}
