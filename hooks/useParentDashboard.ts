import { useCallback, useEffect, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
  toDateString,
  ASSIGNMENT_COLUMNS,
  BEHAVIOR_COLUMNS,
  ATTENDANCE_COLUMNS,
} from '@/lib/constants';
import type { Assignment, Attendance, BehaviorLog } from '@/lib/types';

interface WeeklyStats {
  passed: number;
  total: number;
}

interface MonthlyAttendanceStats {
  present: number;
  total: number;
}

export interface ParentDashboardData {
  assignments: Assignment[];
  behavior: BehaviorLog | null;
  attendance: Attendance | null;
  weeklyStats: WeeklyStats;
  monthlyAttendance: MonthlyAttendanceStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markReviewed: (ids: string[]) => Promise<{ error: string | null }>;
}

export function useParentDashboard(studentId: string | null): ParentDashboardData {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [behavior, setBehavior] = useState<BehaviorLog | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ passed: 0, total: 0 });
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceStats>({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const today = toDateString(now);
      const weekStart = toDateString(startOfWeek(now, { weekStartsOn: 0 }));
      const weekEnd = toDateString(endOfWeek(now, { weekStartsOn: 0 }));
      const monthStart = toDateString(startOfMonth(now));
      const monthEnd = toDateString(endOfMonth(now));

      const [
        assignmentsResult,
        behaviorResult,
        attendanceResult,
        weeklyResult,
        monthlyResult,
      ] = await Promise.all([
        // 1. Today's assignments
        supabase
          .from('assignments')
          .select(ASSIGNMENT_COLUMNS)
          .eq('student_id', studentId)
          .eq('date', today)
          .order('category')
          .limit(3),
        // 2. Today's behavior
        supabase
          .from('behavior_logs')
          .select(BEHAVIOR_COLUMNS)
          .eq('student_id', studentId)
          .eq('date', today)
          .limit(1)
          .maybeSingle(),
        // 3. Today's attendance
        supabase
          .from('attendance')
          .select(ATTENDANCE_COLUMNS)
          .eq('student_id', studentId)
          .eq('date', today)
          .limit(1)
          .maybeSingle(),
        // 4. Weekly assignment stats (max 7 days x 3 categories = 21)
        supabase
          .from('assignments')
          .select('id, status')
          .eq('student_id', studentId)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .limit(50),
        // 5. Monthly attendance stats (max 1 per day = ~31)
        supabase
          .from('attendance')
          .select('id, status')
          .eq('student_id', studentId)
          .gte('date', monthStart)
          .lte('date', monthEnd)
          .limit(35),
      ]);

      if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
      if (behaviorResult.error) throw new Error(behaviorResult.error.message);
      if (attendanceResult.error) throw new Error(attendanceResult.error.message);
      if (weeklyResult.error) throw new Error(weeklyResult.error.message);
      if (monthlyResult.error) throw new Error(monthlyResult.error.message);

      setAssignments((assignmentsResult.data ?? []) as Assignment[]);
      setBehavior((behaviorResult.data as BehaviorLog) ?? null);
      setAttendance((attendanceResult.data as Attendance) ?? null);

      // Compute weekly stats
      const weekAssignments = (weeklyResult.data ?? []) as { id: string; status: string | null }[];
      setWeeklyStats({
        passed: weekAssignments.filter((a) => a.status === 'pass').length,
        total: weekAssignments.length,
      });

      // Compute monthly attendance stats
      const monthAttendance = (monthlyResult.data ?? []) as { id: string; status: string }[];
      setMonthlyAttendance({
        present: monthAttendance.filter((a) => a.status === 'present').length,
        total: monthAttendance.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Realtime subscription
  useEffect(() => {
    if (!studentId) return;

    fetchData();

    // Subscribe to assignment changes for this student
    const channel = supabase
      .channel(`parent-assignments-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, fetchData]);

  const markReviewed = useCallback(
    async (ids: string[]): Promise<{ error: string | null }> => {
      try {
        await Promise.all(
          ids.map(async (id) => {
            const { error: rpcError } = await supabase.rpc(
              'mark_assignment_reviewed',
              { p_assignment_id: id },
            );
            if (rpcError) throw new Error(rpcError.message);
          }),
        );
        // Refresh to get updated data
        await fetchData();
        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to mark as reviewed',
        };
      }
    },
    [fetchData],
  );

  return {
    assignments,
    behavior,
    attendance,
    weeklyStats,
    monthlyAttendance,
    loading,
    error,
    refresh: fetchData,
    markReviewed,
  };
}
