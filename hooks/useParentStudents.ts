import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';

/**
 * Fetches students linked to a parent via the parent_students join table.
 */
export async function fetchParentStudents(
  parentId: string,
): Promise<Student[]> {
  const { data, error } = await supabase
    .from('parent_students')
    .select(
      'student_id, students(id, full_name, arabic_name, current_surah, current_juz)',
    )
    .eq('parent_id', parentId);

  if (error) throw new Error(error.message);

  // Flatten the joined student data
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const student = row.students as {
      id: string;
      full_name: string;
      arabic_name: string | null;
      current_surah: string | null;
      current_juz: number | null;
    };
    return {
      id: student.id,
      full_name: student.full_name,
      arabic_name: student.arabic_name ?? null,
      date_of_birth: null,
      current_surah: student.current_surah ?? null,
      current_juz: student.current_juz ?? null,
      notes: null,
      created_at: '',
      updated_at: '',
    } as Student;
  });
}
