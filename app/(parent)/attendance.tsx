import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, CalendarDays, Check } from 'lucide-react-native';
import { format, startOfMonth, getDay, getDaysInMonth } from 'date-fns';
import { colors } from '@/lib/colors';
import { DAY_LABELS, toDateString } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { useParentAttendanceHistory } from '@/hooks/useParentAttendanceHistory';
import { useAbsenceExcuses } from '@/hooks/useAbsenceExcuses';
import { AttendanceDot } from '@/components/attendance/AttendanceDot';
import { ExcuseForm } from '@/components/attendance/ExcuseForm';
import { StatusChip } from '@/components/ui/StatusChip';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Card } from '@/components/ui/Card';

export default function ParentAttendance() {
  const { profile } = useAuth();
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
  } = useParentStudentContext();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showExcuseForm, setShowExcuseForm] = useState(false);

  const { entries, loading } = useParentAttendanceHistory(
    selectedStudent?.id ?? null,
    year,
    month,
  );

  const { excusesByDate, submitExcuse, submitting } = useAbsenceExcuses(
    selectedStudent?.id ?? null,
    profile?.id ?? null,
  );

  // Navigate months
  const goBack = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goForward = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // Calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = startOfMonth(new Date(year, month));
    const startDow = getDay(firstDay);
    const totalDays = getDaysInMonth(firstDay);

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthLabel = format(new Date(year, month), 'MMMM yyyy');

  // Selected day entry
  const selectedDateStr = selectedDay
    ? toDateString(new Date(year, month, selectedDay))
    : null;
  const selectedEntry = selectedDateStr ? entries.get(selectedDateStr) ?? null : null;
  const selectedExcuse = selectedDateStr ? excusesByDate.get(selectedDateStr) ?? null : null;

  // Monthly summary stats
  const summaryStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    entries.forEach((entry) => {
      if (entry.status === 'present') present++;
      else if (entry.status === 'absent') absent++;
      else if (entry.status === 'late' || entry.status === 'left_early') late++;
    });
    return { present, absent, late };
  }, [entries]);

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-1">
        <Text className="font-heading text-[24px] text-charcoal">
          Attendance
        </Text>
      </View>

      <View className="px-4">
        <ChildSelector
          students={students}
          selectedId={selectedStudent?.id ?? null}
          onSelect={setSelectedStudentId}
        />
      </View>

      {loading ? (
        <LoadingScreen />
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="pb-10">
          {/* Month navigator */}
          <View className="flex-row items-center justify-between my-3">
            <Pressable
              onPress={goBack}
              className="h-12 w-12 items-center justify-center"
              hitSlop={8}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </Pressable>
            <Text className="font-body-semibold text-[16px] text-charcoal">
              {monthLabel}
            </Text>
            <Pressable
              onPress={goForward}
              className="h-12 w-12 items-center justify-center"
              hitSlop={8}
            >
              <ChevronRight size={24} color={colors.primary} />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View className="flex-row mb-2">
            {DAY_LABELS.map((label, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="font-body-medium text-[12px] text-gray-400">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {calendarGrid.map((day, i) => {
              if (day === null) {
                return <View key={`empty-${i}`} className="w-[14.28%] h-12" />;
              }

              const dateStr = toDateString(new Date(year, month, day));
              const entry = entries.get(dateStr);
              const isSelected = selectedDay === day;

              return (
                <Pressable
                  key={day}
                  onPress={() =>
                    setSelectedDay((prev) => (prev === day ? null : day))
                  }
                  className={`w-[14.28%] h-12 items-center justify-center ${
                    isSelected ? 'bg-primary-light rounded-button' : ''
                  }`}
                >
                  <Text
                    className={`font-body text-[13px] mb-0.5 ${
                      isSelected ? 'text-primary font-body-semibold' : 'text-charcoal'
                    }`}
                  >
                    {day}
                  </Text>
                  <AttendanceDot status={entry?.status ?? null} size="sm" />
                </Pressable>
              );
            })}
          </View>

          {/* Selected day detail */}
          {selectedDay && (
            <Card className="mt-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-body-medium text-[14px] text-charcoal">
                  {format(new Date(year, month, selectedDay), 'EEEE, MMM d')}
                </Text>
                {selectedEntry ? (
                  <StatusChip status={selectedEntry.status} />
                ) : (
                  <Text className="font-body text-[13px] text-gray-400">
                    No record
                  </Text>
                )}
              </View>
              {selectedEntry?.notes && (
                <Text className="font-body text-[13px] text-gray-600 mt-1">
                  {selectedEntry.notes}
                </Text>
              )}

              {/* Excuse actions */}
              {selectedEntry?.status === 'absent' && !selectedExcuse && (
                <Pressable
                  onPress={() => setShowExcuseForm(true)}
                  className="mt-2 h-12 justify-center"
                  hitSlop={4}
                >
                  <Text className="font-body-medium text-[13px] text-warning">
                    Submit an excuse →
                  </Text>
                </Pressable>
              )}
              {selectedExcuse && (
                <View className="flex-row items-center mt-2">
                  <Check size={14} color={colors.success} />
                  <Text className="font-body-medium text-[13px] text-success ml-1">
                    Excuse submitted
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Monthly summary */}
          {entries.size > 0 && (
            <Card className="mt-4">
              <Text className="font-heading text-[14px] text-charcoal mb-2">
                Monthly Summary
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="font-heading text-[18px] text-success">
                    {summaryStats.present}
                  </Text>
                  <Text className="font-body text-[12px] text-gray-400">Present</Text>
                </View>
                <View className="items-center">
                  <Text className="font-heading text-[18px] text-error">
                    {summaryStats.absent}
                  </Text>
                  <Text className="font-body text-[12px] text-gray-400">Absent</Text>
                </View>
                <View className="items-center">
                  <Text className="font-heading text-[18px] text-warning">
                    {summaryStats.late}
                  </Text>
                  <Text className="font-body text-[12px] text-gray-400">Late</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Empty state */}
          {entries.size === 0 && (
            <View className="mt-6">
              <EmptyState
                icon={CalendarDays}
                title="No Attendance Data"
                description="No attendance has been recorded for this month."
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* Excuse form modal */}
      <ExcuseForm
        visible={showExcuseForm}
        initialDate={selectedDay ? new Date(year, month, selectedDay) : undefined}
        onClose={() => setShowExcuseForm(false)}
        onSubmit={submitExcuse}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}
