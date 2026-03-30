import { format } from 'date-fns';
import type { AssignmentCategory } from '@/lib/types';

export const APP_NAME = 'Hifdh Tracker';

/** Columns selected when querying the students table */
export const STUDENT_COLUMNS =
  'id, full_name, arabic_name, current_surah, current_juz, notes, date_of_birth, created_at, updated_at' as const;

/** Human-readable labels for assignment categories */
export const CATEGORY_LABELS: Record<AssignmentCategory, string> = {
  new_lesson: 'New Lesson',
  previous_lesson: 'Previous Lesson',
  revision: 'Revision',
};

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
