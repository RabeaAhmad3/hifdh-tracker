import { useCallback, useEffect, useState } from 'react';
import { addMinutes, format, getDay, parse, isBefore, startOfDay, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
  MEETING_BOOKING_COLUMNS,
  MEETING_SLOT_DURATION_MINUTES,
  TEACHER_AVAILABILITY_COLUMNS,
} from '@/lib/constants';
import type {
  MeetingBookingWithDetails,
  TeacherAvailability,
  UserRole,
} from '@/lib/types';

// ============================================================
// Standalone async functions
// ============================================================

export async function fetchTeacherAvailability(
  teacherId: string,
): Promise<{ data: TeacherAvailability[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('teacher_availability')
      .select(TEACHER_AVAILABILITY_COLUMNS)
      .eq('teacher_id', teacherId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw new Error(error.message);
    return { data: (data ?? []) as TeacherAvailability[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch availability' };
  }
}

export async function addAvailabilitySlot(params: {
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('teacher_availability')
      .insert(params);

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add slot' };
  }
}

export async function toggleAvailabilitySlot(
  id: string,
  isActive: boolean,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('teacher_availability')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to toggle slot' };
  }
}

export async function deleteAvailabilitySlot(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('teacher_availability')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete slot' };
  }
}

export interface TimeSlot {
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
}

export async function fetchAvailableSlots(
  teacherId: string,
  date: string, // yyyy-MM-dd
): Promise<{ data: TimeSlot[]; error: string | null }> {
  try {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    const dayOfWeek = getDay(dateObj); // 0=Sun, 6=Sat

    // Get active availability for this day
    const { data: availability, error: aError } = await supabase
      .from('teacher_availability')
      .select(TEACHER_AVAILABILITY_COLUMNS)
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (aError) throw new Error(aError.message);
    if (!availability || availability.length === 0) return { data: [], error: null };

    // Get confirmed bookings for this teacher+date
    const { data: bookings, error: bError } = await supabase
      .from('meeting_bookings')
      .select('start_time, end_time')
      .eq('teacher_id', teacherId)
      .eq('date', date)
      .eq('status', 'confirmed');

    if (bError) throw new Error(bError.message);

    // Generate 30-min slots from each availability window
    const slots: TimeSlot[] = [];
    for (const avail of availability) {
      let current = parse(avail.start_time, 'HH:mm:ss', dateObj);
      const windowEnd = parse(avail.end_time, 'HH:mm:ss', dateObj);

      while (true) {
        const slotEnd = addMinutes(current, MEETING_SLOT_DURATION_MINUTES);
        if (isBefore(windowEnd, slotEnd)) break;

        const slotStartStr = format(current, 'HH:mm:ss');
        const slotEndStr = format(slotEnd, 'HH:mm:ss');

        // Check if slot overlaps with any existing booking
        const isBooked = (bookings ?? []).some((b) => {
          return slotStartStr < b.end_time && slotEndStr > b.start_time;
        });

        if (!isBooked) {
          slots.push({ start_time: slotStartStr, end_time: slotEndStr });
        }

        current = slotEnd;
      }
    }

    return { data: slots, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch slots' };
  }
}

export interface AvailableDate {
  date: string; // yyyy-MM-dd
  available: boolean;
  slotCount: number;
}

export async function fetchAvailableDates(
  teacherId: string,
  yearMonth: string, // yyyy-MM
): Promise<{ data: AvailableDate[]; error: string | null }> {
  try {
    const monthStart = startOfMonth(parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date()));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    // Get active availability days for this teacher
    const { data: availability, error: aError } = await supabase
      .from('teacher_availability')
      .select(TEACHER_AVAILABILITY_COLUMNS)
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    if (aError) throw new Error(aError.message);
    if (!availability || availability.length === 0) return { data: [], error: null };

    // Get all confirmed bookings for this teacher in this month
    const { data: bookings, error: bError } = await supabase
      .from('meeting_bookings')
      .select('date, start_time, end_time')
      .eq('teacher_id', teacherId)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      .eq('status', 'confirmed');

    if (bError) throw new Error(bError.message);

    // Group availability by day_of_week
    const availByDay = new Map<number, TeacherAvailability[]>();
    for (const a of availability) {
      const existing = availByDay.get(a.day_of_week) ?? [];
      existing.push(a as TeacherAvailability);
      availByDay.set(a.day_of_week, existing);
    }

    // Group bookings by date
    const bookingsByDate = new Map<string, { start_time: string; end_time: string }[]>();
    for (const b of bookings ?? []) {
      const existing = bookingsByDate.get(b.date) ?? [];
      existing.push(b);
      bookingsByDate.set(b.date, existing);
    }

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const result: AvailableDate[] = [];

    for (const day of allDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dow = getDay(day);
      const dayAvail = availByDay.get(dow);

      if (!dayAvail || isBefore(day, today)) {
        result.push({ date: dateStr, available: false, slotCount: 0 });
        continue;
      }

      // Count total possible slots
      let totalSlots = 0;
      for (const avail of dayAvail) {
        let current = parse(avail.start_time, 'HH:mm:ss', day);
        const windowEnd = parse(avail.end_time, 'HH:mm:ss', day);
        while (true) {
          const slotEnd = addMinutes(current, MEETING_SLOT_DURATION_MINUTES);
          if (isBefore(windowEnd, slotEnd)) break;
          totalSlots++;
          current = slotEnd;
        }
      }

      // Count booked slots
      const dateBookings = bookingsByDate.get(dateStr) ?? [];
      const bookedCount = dateBookings.length;
      const availableSlots = totalSlots - bookedCount;

      result.push({
        date: dateStr,
        available: availableSlots > 0,
        slotCount: availableSlots,
      });
    }

    return { data: result, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch available dates' };
  }
}

export async function bookMeeting(params: {
  teacher_id: string;
  parent_id: string;
  student_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}): Promise<{ error: string | null }> {
  try {
    // Check for double-booking
    const { data: existing, error: checkError } = await supabase
      .from('meeting_bookings')
      .select('id')
      .eq('teacher_id', params.teacher_id)
      .eq('date', params.date)
      .eq('status', 'confirmed')
      .lt('start_time', params.end_time)
      .gt('end_time', params.start_time)
      .limit(1);

    if (checkError) throw new Error(checkError.message);
    if (existing && existing.length > 0) {
      return { error: 'This time slot has already been booked.' };
    }

    const { error } = await supabase
      .from('meeting_bookings')
      .insert({
        teacher_id: params.teacher_id,
        parent_id: params.parent_id,
        student_id: params.student_id,
        date: params.date,
        start_time: params.start_time,
        end_time: params.end_time,
        notes: params.notes ?? null,
        status: 'confirmed',
      });

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to book meeting' };
  }
}

export async function fetchUpcomingMeetings(
  userId: string,
  role: UserRole,
): Promise<{ data: MeetingBookingWithDetails[]; error: string | null }> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    let query = supabase
      .from('meeting_bookings')
      .select(MEETING_BOOKING_COLUMNS)
      .eq('status', 'confirmed')
      .gte('date', today)
      .order('date')
      .order('start_time')
      .limit(20);

    if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    } else {
      query = query.eq('parent_id', userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { data: [], error: null };

    // Fetch names for all participants
    const teacherIds = [...new Set(data.map((m) => m.teacher_id))];
    const parentIds = [...new Set(data.map((m) => m.parent_id))];
    const studentIds = [...new Set(data.map((m) => m.student_id))];

    const [teacherResult, parentResult, studentResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', teacherIds),
      supabase.from('profiles').select('id, full_name').in('id', parentIds),
      supabase.from('students').select('id, full_name').in('id', studentIds),
    ]);

    const nameMap = new Map<string, string>();
    for (const p of teacherResult.data ?? []) nameMap.set(p.id, p.full_name);
    for (const p of parentResult.data ?? []) nameMap.set(p.id, p.full_name);

    const studentNameMap = new Map<string, string>();
    for (const s of studentResult.data ?? []) studentNameMap.set(s.id, s.full_name);

    const meetings: MeetingBookingWithDetails[] = data.map((m) => ({
      ...m,
      teacher_name: nameMap.get(m.teacher_id) ?? 'Unknown',
      parent_name: nameMap.get(m.parent_id) ?? 'Unknown',
      student_name: studentNameMap.get(m.student_id) ?? 'Unknown',
    }));

    return { data: meetings, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch meetings' };
  }
}

export async function cancelMeeting(
  bookingId: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('meeting_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel meeting' };
  }
}

// ============================================================
// React hooks
// ============================================================

export function useTeacherAvailability(teacherId: string | undefined) {
  const [slots, setSlots] = useState<TeacherAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    const result = await fetchTeacherAvailability(teacherId);
    setSlots(result.data);
    setError(result.error);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSlot = useCallback(
    async (params: { day_of_week: number; start_time: string; end_time: string }) => {
      if (!teacherId) return { error: 'No teacher ID' };
      const result = await addAvailabilitySlot({ teacher_id: teacherId, ...params });
      if (!result.error) await refresh();
      return result;
    },
    [teacherId, refresh],
  );

  const toggleSlot = useCallback(
    async (id: string, isActive: boolean) => {
      // Optimistic update
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));
      const result = await toggleAvailabilitySlot(id, isActive);
      if (result.error) await refresh();
      return result;
    },
    [refresh],
  );

  const deleteSlot = useCallback(
    async (id: string) => {
      // Optimistic update
      setSlots((prev) => prev.filter((s) => s.id !== id));
      const result = await deleteAvailabilitySlot(id);
      if (result.error) await refresh();
      return result;
    },
    [refresh],
  );

  return { slots, loading, error, refresh, addSlot, toggleSlot, deleteSlot };
}

export function useAvailableSlots(teacherId: string | undefined, date: string | null) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId || !date) {
      setSlots([]);
      return;
    }

    let stale = false;
    setLoading(true);

    fetchAvailableSlots(teacherId, date).then((result) => {
      if (stale) return;
      setSlots(result.data);
      setError(result.error);
      setLoading(false);
    });

    return () => { stale = true; };
  }, [teacherId, date]);

  return { slots, loading, error };
}

export function useUpcomingMeetings(userId: string | undefined, role: UserRole) {
  const [meetings, setMeetings] = useState<MeetingBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const result = await fetchUpcomingMeetings(userId, role);
    setMeetings(result.data);
    setError(result.error);
    setLoading(false);
  }, [userId, role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancel = useCallback(
    async (bookingId: string) => {
      const result = await cancelMeeting(bookingId);
      if (!result.error) {
        setMeetings((prev) => prev.filter((m) => m.id !== bookingId));
      }
      return result;
    },
    [],
  );

  return { meetings, loading, error, refresh, cancel };
}
