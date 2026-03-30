import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ClipboardCheck } from 'lucide-react-native';

import { fetchForDate, type AssignmentWithStudent } from '@/hooks/useAssignments';
import { toDateString } from '@/lib/constants';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateNavigator } from '@/components/ui/DateNavigator';
import { AssignmentHistoryRow } from '@/components/assignments/AssignmentHistoryRow';

const PAGE_SIZE = 20;

export default function AssignmentList() {
  const router = useRouter();

  const [date, setDate] = useState<Date>(new Date());
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
        const dateStr = toDateString(d);
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

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="font-heading text-[24px] text-charcoal mb-3">
          Assignments
        </Text>

        <DateNavigator date={date} onChange={setDate} />
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
