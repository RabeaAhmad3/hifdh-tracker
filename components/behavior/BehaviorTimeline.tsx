import { memo, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';
import { subDays, format } from 'date-fns';
import { toDateString } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BehaviorDot } from '@/components/behavior/BehaviorDot';
import type { BehaviorHistoryEntry } from '@/hooks/useBehaviorHistory';
import type { BehaviorRating } from '@/lib/types';

interface BehaviorTimelineProps {
  entries: BehaviorHistoryEntry[];
  entriesByDate: Map<string, BehaviorHistoryEntry>;
  loading: boolean;
}

export const BehaviorTimeline = memo(function BehaviorTimeline({
  entries,
  entriesByDate,
  loading,
}: BehaviorTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 30-day array from today backwards — stable unless entries change
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => toDateString(subDays(today, i)));
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps -- recompute when data refreshes

  const counts = useMemo(() => {
    const c: Record<BehaviorRating, number> = {
      very_good: 0,
      good: 0,
      needs_improvement: 0,
    };
    for (const entry of entries) c[entry.rating]++;
    return c;
  }, [entries]);

  if (loading) return <LoadingScreen />;

  const hasAnyEntries = entries.length > 0;
  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;

  return (
    <Card>
      <Text className="font-heading text-[18px] text-charcoal mb-3">
        Behavior History
      </Text>

      {!hasAnyEntries ? (
        <EmptyState
          icon={Activity}
          title="No Behavior Data"
          description="No behavior has been recorded in the last 30 days."
        />
      ) : (
        <>
          {/* 30-day dot grid */}
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {days.map((date) => {
              const entry = entriesByDate.get(date);
              return (
                <BehaviorDot
                  key={date}
                  rating={entry?.rating ?? null}
                  size="md"
                  onPress={() =>
                    setSelectedDate((prev) => (prev === date ? null : date))
                  }
                />
              );
            })}
          </View>

          {/* Selected day detail */}
          {selectedDate && (
            <View className="bg-gray-100 rounded-button p-3 mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-body-medium text-[14px] text-charcoal">
                  {format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d')}
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

          {/* Summary stats */}
          <View className="flex-row gap-2">
            <StatusChip
              status="very_good"
              label={`${counts.very_good} Very Good`}
            />
            <StatusChip status="good" label={`${counts.good} Good`} />
            <StatusChip
              status="needs_improvement"
              label={`${counts.needs_improvement} Needs Imp.`}
            />
          </View>
        </>
      )}
    </Card>
  );
});
