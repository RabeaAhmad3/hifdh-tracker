import { View, Text, Pressable } from 'react-native';
import { ChevronRight, SmilePlus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { BehaviorDot } from '@/components/behavior/BehaviorDot';
import { colors } from '@/lib/colors';
import { DAY_LABELS } from '@/lib/constants';
import type { BehaviorLog, BehaviorRating } from '@/lib/types';

interface WeekEntry {
  date: string;
  rating: BehaviorRating | null;
}

interface TodayBehaviorCardProps {
  behavior: BehaviorLog | null;
  weekHistory?: WeekEntry[];
  onViewHistory?: () => void;
}

export function TodayBehaviorCard({
  behavior,
  weekHistory,
  onViewHistory,
}: TodayBehaviorCardProps) {
  if (!behavior) {
    return (
      <Card className="py-6">
        <EmptyState
          icon={SmilePlus}
          title="No Behavior Log"
          description="No behavior report for today yet."
        />
        {weekHistory && weekHistory.length > 0 && (
          <View className="mt-4 px-6">
            <WeekDots weekHistory={weekHistory} />
          </View>
        )}
        {onViewHistory && (
          <HistoryLink onPress={onViewHistory} />
        )}
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-heading text-[16px] text-charcoal">
          Behavior
        </Text>
        <StatusChip status={behavior.rating} />
      </View>
      {behavior.notes && (
        <Text className="font-body text-[14px] text-gray-600">
          {behavior.notes}
        </Text>
      )}
      {weekHistory && weekHistory.length > 0 && (
        <View className="mt-3">
          <WeekDots weekHistory={weekHistory} />
        </View>
      )}
      {onViewHistory && (
        <HistoryLink onPress={onViewHistory} />
      )}
    </Card>
  );
}

function WeekDots({ weekHistory }: { weekHistory: WeekEntry[] }) {
  return (
    <View className="flex-row justify-between">
      {weekHistory.map((entry) => {
        const dayIndex = new Date(entry.date + 'T00:00:00').getDay();
        return (
        <View key={entry.date} className="items-center gap-1">
          <Text className="font-body text-[11px] text-gray-400">
            {DAY_LABELS[dayIndex]}
          </Text>
          <BehaviorDot rating={entry.rating} size="sm" />
        </View>
        );
      })}
    </View>
  );
}

function HistoryLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center mt-3 h-10"
    >
      <Text className="font-body-medium text-[13px] text-primary mr-1">
        View Full History
      </Text>
      <ChevronRight size={14} color={colors.primary} />
    </Pressable>
  );
}
