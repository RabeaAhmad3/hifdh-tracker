import { format } from 'date-fns';
import type { AssignmentCategory, AttendanceStatus, BehaviorRating } from '@/lib/types';
import { colors } from '@/lib/colors';

export const APP_NAME = 'Hifdh Tracker';

/** Columns selected when querying the students table */
export const STUDENT_COLUMNS =
  'id, full_name, arabic_name, current_surah, current_juz, notes, date_of_birth, created_at, updated_at' as const;

/** Columns selected when querying the assignments table */
export const ASSIGNMENT_COLUMNS =
  'id, student_id, teacher_id, date, category, surah_number, surah_name, start_ayah, end_ayah, status, mistakes, pauses, pages_completed, recited_to, next_assignment, notes, parent_reviewed, parent_reviewed_at, created_at, updated_at' as const;

/** Columns selected when querying the behavior_logs table */
export const BEHAVIOR_COLUMNS =
  'id, student_id, teacher_id, date, rating, notes, created_at, updated_at' as const;

/** Columns selected when querying the attendance table */
export const ATTENDANCE_COLUMNS =
  'id, student_id, teacher_id, date, status, notes, created_at, updated_at' as const;

/** Human-readable labels for assignment categories */
export const CATEGORY_LABELS: Record<AssignmentCategory, string> = {
  new_lesson: 'New Lesson',
  previous_lesson: 'Previous Lesson',
  revision: 'Revision',
};

/** Day-of-week abbreviations starting from Sunday */
export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** Semantic color for each behavior rating */
export const RATING_COLORS: Record<BehaviorRating, string> = {
  very_good: colors.success,
  good: colors.accent,
  needs_improvement: colors.warning,
};

/** Columns selected when querying the absence_excuses table */
export const ABSENCE_EXCUSE_COLUMNS =
  'id, student_id, parent_id, date, reason, created_at' as const;

/** Semantic color for each attendance status */
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: colors.success,
  absent: colors.error,
  late: colors.warning,
  left_early: colors.warning,
};

/** Attendance statuses with human-readable labels */
export const ATTENDANCE_STATUSES: { key: AttendanceStatus; label: string }[] = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
  { key: 'left_early', label: 'Left Early' },
];

/** Format a Date to the yyyy-MM-dd string used for Supabase queries */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format an underscore-separated enum value to Title Case */
export function formatLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
