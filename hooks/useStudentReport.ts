import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toDateString } from '@/lib/constants';
import type {
  DateRangePreset,
  StudentReport,
  TrendDataPoint,
  AttendanceSummary,
  BehaviorSummary,
  CategoryPassRate,
} from '@/lib/types';

const EMPTY_CATEGORY: CategoryPassRate = { total: 0, passed: 0, pass_rate: 0, pages: 0 };
const EMPTY_REPORT: StudentReport = {
  new_lesson: EMPTY_CATEGORY,
  previous_lesson: EMPTY_CATEGORY,
  revision: EMPTY_CATEGORY,
};
const EMPTY_ATTENDANCE: AttendanceSummary = { present: 0, absent: 0, late: 0, left_early: 0, total: 0 };
const EMPTY_BEHAVIOR: BehaviorSummary = { very_good: 0, good: 0, needs_improvement: 0, total: 0 };

export function useStudentReport(studentId: string | null) {
  const [report, setReport] = useState<StudentReport>(EMPTY_REPORT);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(EMPTY_ATTENDANCE);
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummary>(EMPTY_BEHAVIOR);

  const [dateRange, setDateRange] = useState<DateRangePreset>('this_week');
  const [customStart, setCustomStart] = useState<Date>(new Date());
  const [customEnd, setCustomEnd] = useState<Date>(new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize date bounds so consumers can use them without recomputing
  const dateBounds = useMemo(() => {
    const now = new Date();
    if (dateRange === 'this_week') {
      return {
        startDate: toDateString(startOfWeek(now, { weekStartsOn: 0 })),
        endDate: toDateString(endOfWeek(now, { weekStartsOn: 0 })),
      };
    }
    if (dateRange === 'this_month') {
      return {
        startDate: toDateString(startOfMonth(now)),
        endDate: toDateString(endOfMonth(now)),
      };
    }
    return {
      startDate: toDateString(customStart),
      endDate: toDateString(customEnd),
    };
  }, [dateRange, customStart, customEnd]);

  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    const id = ++fetchIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const { startDate: start, endDate: end } = dateBounds;

      const [reportRes, trendsRes, attendanceRes, behaviorRes] = await Promise.all([
        supabase.rpc('get_student_report', {
          p_student_id: studentId,
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc('get_student_trends', {
          p_student_id: studentId,
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc('get_attendance_summary', {
          p_student_id: studentId,
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc('get_behavior_summary', {
          p_student_id: studentId,
          p_start_date: start,
          p_end_date: end,
        }),
      ]);

      // Discard stale responses if a newer fetch was triggered
      if (id !== fetchIdRef.current) return;

      if (reportRes.error) throw new Error(reportRes.error.message);
      if (trendsRes.error) throw new Error(trendsRes.error.message);
      if (attendanceRes.error) throw new Error(attendanceRes.error.message);
      if (behaviorRes.error) throw new Error(behaviorRes.error.message);

      const raw = (reportRes.data ?? {}) as Record<string, CategoryPassRate>;
      setReport({
        new_lesson: raw.new_lesson ?? EMPTY_CATEGORY,
        previous_lesson: raw.previous_lesson ?? EMPTY_CATEGORY,
        revision: raw.revision ?? EMPTY_CATEGORY,
      });

      setTrends((trendsRes.data ?? []) as TrendDataPoint[]);
      setAttendanceSummary((attendanceRes.data ?? EMPTY_ATTENDANCE) as AttendanceSummary);
      setBehaviorSummary((behaviorRes.data ?? EMPTY_BEHAVIOR) as BehaviorSummary);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [studentId, dateBounds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    report,
    trends,
    attendanceSummary,
    behaviorSummary,
    startDate: dateBounds.startDate,
    endDate: dateBounds.endDate,
    dateRange,
    setDateRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    loading,
    error,
    refresh: fetchData,
  };
}
