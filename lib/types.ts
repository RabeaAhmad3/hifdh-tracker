// ============================================================
// TypeScript types — mirrors Supabase schema
// ============================================================

export type UserRole = 'admin' | 'teacher' | 'parent';
export type AssignmentCategory = 'new_lesson' | 'previous_lesson' | 'revision';
export type PassStatus = 'pass' | 'not_pass';
export type BehaviorRating = 'very_good' | 'good' | 'needs_improvement';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'left_early';
export type InviteStatus = 'pending' | 'used' | 'expired';
export type MeetingStatus = 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  arabic_name: string | null;
  date_of_birth: string | null;
  current_surah: string | null;
  current_juz: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  student_id: string;
  created_by: string;
  status: InviteStatus;
  used_by: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  category: AssignmentCategory;
  surah_number: number | null;
  surah_name: string | null;
  start_ayah: number | null;
  end_ayah: number | null;
  status: PassStatus | null;
  mistakes: number;
  pauses: number;
  pages_completed: number;
  recited_to: string | null;
  next_assignment: string | null;
  notes: string | null;
  parent_reviewed: boolean;
  parent_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BehaviorLog {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  rating: BehaviorRating;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AbsenceExcuse {
  id: string;
  student_id: string;
  parent_id: string;
  date: string;
  reason: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingBooking {
  id: string;
  teacher_id: string;
  parent_id: string;
  student_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: MeetingStatus;
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Report & Analytics types
// ============================================================

export interface CategoryPassRate {
  total: number;
  passed: number;
  pass_rate: number;
  pages: number;
}

export interface StudentReport {
  new_lesson: CategoryPassRate;
  previous_lesson: CategoryPassRate;
  revision: CategoryPassRate;
}

export interface TrendDataPoint {
  date: string;
  category: AssignmentCategory;
  passed: boolean;
  mistakes: number;
  pauses: number;
  pages_completed: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  left_early: number;
  total: number;
}

export interface BehaviorSummary {
  very_good: number;
  good: number;
  needs_improvement: number;
  total: number;
}

export interface ClassOverview {
  today_attendance: { present: number; total: number };
  students_without_assignments_today: { id: string; full_name: string }[];
  weekly_pass_rates: { new_lesson: number; previous_lesson: number; revision: number };
  pending_excuses: number;
}

export type DateRangePreset = 'this_week' | 'this_month' | 'custom';
