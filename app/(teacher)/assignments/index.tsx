import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, addDays, subDays } from 'date-fns';

import { fetchForDate, type AssignmentWithStudent } from '@/hooks/useAssignments';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AssignmentHistoryRow } from '@/components/assignments/AssignmentHistoryRow';
import { colors } from '@/lib/colors';

const PAGE_SIZE = 20;

export default function AssignmentList() {
  const router = useRouter();

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentWithStudent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(
    async (d: Date, pageNum: number, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const dateStr = format(d, 'yyyy-MM-dd');
        const { data, count } = await fetchForDate(dateStr, pageNum, PAGE_SIZE);

        if (pageNum === 0) {
          setAssignments(data);
        } else {
          setAssignments((prev) => [...prev, ...data]);
        }
        setTotalCount(count);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadAssignments(date, 0);
  }, [date, loadAssignments]);

  const handleRefresh = useCallback(() => {
    loadAssignments(date, 0, true);
  }, [date, loadAssignments]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing) return;
    const nextPage = page + 1;
    if (nextPage * PAGE_SIZE >= totalCount) return;
    loadAssignments(date, nextPage);
  }, [loading, refreshing, page, totalCount, date, loadAssignments]);

  // Date navigation
  const goToPreviousDay = () => setDate((d) => subDays(d, 1));
  const goToNextDay = () => setDate((d) => addDays(d, 1));

  const handleDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate != null) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: AssignmentWithStudent }) => (
      <AssignmentHistoryRow
        assignment={item}
        onPress={() =>
          router.push({
            pathname: '/(teacher)/students/[id]',
            params: { id: item.student_id },
          })
        }
      />
    ),
    [router],
  );

  const keyExtractor = useCallback(
    (item: AssignmentWithStudent) => item.id,
    [],
  );

  const ItemSeparator = useCallback(
    () => <View className="h-3" />,
    [],
  );

  const dateDisplay = format(date, 'EEE, MMM d, yyyy');

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="font-heading text-[24px] text-charcoal mb-3">
          Assignments
        </Text>

        {/* Date picker row */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={goToPreviousDay}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </Pressable>

          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text className="font-body-semibold text-[16px] text-charcoal">
              {dateDisplay}
            </Text>
          </Pressable>

          <Pressable
            onPress={goToNextDay}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <ChevronRight size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Date picker (conditional) */}
        {showDatePicker && (
          <View className="mt-2">
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="mt-2 self-center"
              >
                <Text className="font-body-semibold text-[14px] text-primary">
                  Done
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {error != null && (
        <View className="px-4 mb-2">
          <Text className="font-body text-[14px] text-error">{error}</Text>
        </View>
      )}

      {loading && assignments.length === 0 ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <View className="mt-16">
                <EmptyState
                  icon={ClipboardCheck}
                  title="No Assignments"
                  description="No assignments recorded for this date."
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
