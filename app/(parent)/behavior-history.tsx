import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';
import { format, startOfMonth, getDay, getDaysInMonth } from 'date-fns';
import { colors } from '@/lib/colors';
import { DAY_LABELS, toDateString } from '@/lib/constants';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { useParentBehaviorHistory } from '@/hooks/useParentBehaviorHistory';
import { BehaviorDot } from '@/components/behavior/BehaviorDot';
import { StatusChip } from '@/components/ui/StatusChip';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function BehaviorHistory() {
  const router = useRouter();
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
  } = useParentStudentContext();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const { entries, loading } = useParentBehaviorHistory(
    selectedStudent?.id ?? null,
    year,
    month,
  );

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  // Calendar grid computation
  const calendarGrid = useMemo(() => {
    const firstDay = startOfMonth(new Date(year, month));
    const startDow = getDay(firstDay); // 0=Sun
    const totalDays = getDaysInMonth(firstDay);

    // Cells: null for padding, number for day
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    // Pad to complete final row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  const monthLabel = format(new Date(year, month), 'MMMM yyyy');

  // Selected day entry
  const selectedDateStr = selectedDay
    ? toDateString(new Date(year, month, selectedDay))
    : null;
  const selectedEntry = selectedDateStr ? entries.get(selectedDateStr) ?? null : null;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <Pressable
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center -ml-2"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>
        <Text className="font-heading text-[20px] text-charcoal flex-1">
          Behavior History
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
                  <BehaviorDot rating={entry?.rating ?? null} size="sm" />
                </Pressable>
              );
            })}
          </View>

          {/* Selected day detail */}
          {selectedDay && (
            <View className="mt-4 bg-white rounded-card p-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-body-medium text-[14px] text-charcoal">
                  {format(new Date(year, month, selectedDay), 'EEEE, MMM d')}
                </Text>
                {selectedEntry ? (
                  <StatusChip status={selectedEntry.rating} />
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
            </View>
          )}

          {/* Empty state if no entries for the month */}
          {entries.size === 0 && (
            <View className="mt-6">
              <EmptyState
                icon={CalendarDays}
                title="No Behavior Data"
                description="No behavior has been recorded for this month."
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
