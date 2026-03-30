import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  parse,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { colors } from '@/lib/colors';
import { DAY_LABELS } from '@/lib/constants';
import {
  fetchAvailableDates,
  type AvailableDate,
} from '@/hooks/useMeetingScheduling';

interface DateSelectorProps {
  teacherId: string;
  selectedDate: string | null; // yyyy-MM-dd
  onSelectDate: (date: string) => void;
}

export function DateSelector({ teacherId, selectedDate, onSelectDate }: DateSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);

  const yearMonth = format(currentMonth, 'yyyy-MM');

  const loadDates = useCallback(async () => {
    setLoading(true);
    const result = await fetchAvailableDates(teacherId, yearMonth);
    setAvailableDates(result.data);
    setLoading(false);
  }, [teacherId, yearMonth]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDayOfWeek = getDay(monthStart); // 0=Sun

  // Build availability lookup
  const availMap = useMemo(() => {
    const map = new Map<string, AvailableDate>();
    for (const d of availableDates) map.set(d.date, d);
    return map;
  }, [availableDates]);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [startDayOfWeek, daysInMonth]);

  return (
    <View>
      {/* Month navigation */}
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
        >
          <ChevronLeft size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-heading text-[17px] text-charcoal">
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <Pressable
          onPress={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}
        >
          <ChevronRight size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="mb-1 flex-row">
        {DAY_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center py-1">
            <Text className="font-body-semibold text-[12px] text-gray-400">{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {loading ? (
        <View className="items-center py-8">
          <Text className="font-body text-[13px] text-gray-400">Loading dates...</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap">
          {cells.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} className="h-10" style={{ width: '14.28%' }} />;
            }

            const dateStr = format(
              parse(`${yearMonth}-${String(day).padStart(2, '0')}`, 'yyyy-MM-dd', new Date()),
              'yyyy-MM-dd',
            );
            const avail = availMap.get(dateStr);
            const isAvailable = avail?.available ?? false;
            const isSelected = selectedDate === dateStr;

            let cellBg = '';
            let textColor = 'text-gray-300';

            if (isSelected) {
              cellBg = 'bg-primary';
              textColor = 'text-white';
            } else if (isAvailable) {
              cellBg = 'bg-primary/10';
              textColor = 'text-primary';
            }

            return (
              <Pressable
                key={dateStr}
                onPress={() => isAvailable && onSelectDate(dateStr)}
                disabled={!isAvailable}
                className={`h-10 items-center justify-center rounded-full ${cellBg}`}
                style={{ width: '14.28%' }}
              >
                <Text className={`font-body text-[14px] ${textColor}`}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
