import { supabase } from '@/lib/supabase';
import type {
  Assignment,
  AssignmentCategory,
  BehaviorLog,
  BehaviorRating,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssignmentWithStudent extends Assignment {
  student_full_name: string;
}

interface CategoryPayload {
  category: AssignmentCategory;
  enabled: boolean;
  surah_number: number | null;
  surah_name: string | null;
  start_ayah: number | null;
  end_ayah: number | null;
  status: 'pass' | 'not_pass' | null;
  mistakes: number;
  pauses: number;
  pages_completed: number;
  recited_to: string | null;
  notes: string | null;
}

export interface SaveStudentDayPayload {
  studentId: string;
  teacherId: string;
  date: string;
  categories: CategoryPayload[];
  behavior: {
    rating: BehaviorRating;
    notes: string | null;
  } | null;
  nextAssignment: string | null;
}

// ---------------------------------------------------------------------------
// Column selections
// ---------------------------------------------------------------------------

const ASSIGNMENT_COLUMNS =
  'id, student_id, teacher_id, date, category, surah_number, surah_name, start_ayah, end_ayah, status, mistakes, pauses, pages_completed, recited_to, next_assignment, notes, parent_reviewed, parent_reviewed_at, created_at, updated_at';

const BEHAVIOR_COLUMNS =
  'id, student_id, teacher_id, date, rating, notes, created_at, updated_at';

// ---------------------------------------------------------------------------
// fetchForStudentDate
// ---------------------------------------------------------------------------

export async function fetchForStudentDate(
  studentId: string,
  date: string,
): Promise<{ assignments: Assignment[]; behavior: BehaviorLog | null }> {
  const [assignmentsResult, behaviorResult] = await Promise.all([
    supabase
      .from('assignments')
      .select(ASSIGNMENT_COLUMNS)
      .eq('student_id', studentId)
      .eq('date', date)
      .order('category')
      .limit(3),
    supabase
      .from('behavior_logs')
      .select(BEHAVIOR_COLUMNS)
      .eq('student_id', studentId)
      .eq('date', date)
      .limit(1)
      .maybeSingle(),
  ]);

  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
  if (behaviorResult.error) throw new Error(behaviorResult.error.message);

  return {
    assignments: (assignmentsResult.data ?? []) as Assignment[],
    behavior: (behaviorResult.data as BehaviorLog) ?? null,
  };
}

// ---------------------------------------------------------------------------
// fetchForDate  (paginated, with student name join)
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 20;

export async function fetchForDate(
  date: string,
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ data: AssignmentWithStudent[]; count: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('assignments')
    .select(
      `${ASSIGNMENT_COLUMNS}, students!inner(full_name)`,
      { count: 'exact' },
    )
    .eq('date', date)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  // Flatten the joined student name onto each row
  const rows: AssignmentWithStudent[] = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const students = row.students as { full_name: string } | null;
    return {
      ...(row as unknown as Assignment),
      student_full_name: students?.full_name ?? '',
    };
  });

  return { data: rows, count: count ?? 0 };
}

// ---------------------------------------------------------------------------
// fetchTeachers
// ---------------------------------------------------------------------------

export async function fetchTeachers(): Promise<
  { id: string; full_name: string }[]
> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['teacher', 'admin'])
    .order('full_name');

  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; full_name: string }[];
}

// ---------------------------------------------------------------------------
// saveStudentDay  — upserts assignments + behavior
// ---------------------------------------------------------------------------

export async function saveStudentDay(
  payload: SaveStudentDayPayload,
): Promise<{ error: string | null }> {
  const { studentId, teacherId, date, categories, behavior, nextAssignment } =
    payload;

  try {
    // Build assignment upsert rows for enabled categories only
    const assignmentRows = categories
      .filter((c) => c.enabled)
      .map((c) => ({
        student_id: studentId,
        teacher_id: teacherId,
        date,
        category: c.category,
        surah_number: c.surah_number,
        surah_name: c.surah_name,
        start_ayah: c.start_ayah,
        end_ayah: c.end_ayah,
        status: c.status,
        mistakes: c.mistakes,
        pauses: c.pauses,
        pages_completed: c.pages_completed,
        recited_to: c.recited_to,
        notes: c.notes,
        // next_assignment stored on the new_lesson row, or first enabled if none
        next_assignment:
          c.category === 'new_lesson'
            ? nextAssignment
            : null,
      }));

    // If nextAssignment provided but no new_lesson category, attach to first row
    if (
      nextAssignment &&
      assignmentRows.length > 0 &&
      !assignmentRows.some((r) => r.category === 'new_lesson')
    ) {
      assignmentRows[0].next_assignment = nextAssignment;
    }

    // Validate ayah ranges
    for (const row of assignmentRows) {
      if (row.start_ayah != null && row.end_ayah != null && row.start_ayah > row.end_ayah) {
        return { error: 'Start ayah must be less than or equal to end ayah' };
      }
    }

    // Run all DB operations in parallel (they are independent)
    const disabledCategories = categories
      .filter((c) => !c.enabled)
      .map((c) => c.category);

    const operations = await Promise.all([
      // Upsert assignments (unique on student_id + date + category)
      assignmentRows.length > 0
        ? supabase
            .from('assignments')
            .upsert(assignmentRows, { onConflict: 'student_id,date,category' })
        : null,
      // Delete disabled categories (remove stale rows if teacher un-toggled a card)
      disabledCategories.length > 0
        ? supabase
            .from('assignments')
            .delete()
            .eq('student_id', studentId)
            .eq('date', date)
            .in('category', disabledCategories)
        : null,
      // Upsert behavior log if provided
      behavior
        ? supabase
            .from('behavior_logs')
            .upsert(
              {
                student_id: studentId,
                teacher_id: teacherId,
                date,
                rating: behavior.rating,
                notes: behavior.notes,
              },
              { onConflict: 'student_id,date' },
            )
        : null,
    ]);

    for (const op of operations) {
      if (op?.error) return { error: op.error.message };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to save student day',
    };
  }
}
