import { View, Text } from 'react-native';
import { SmilePlus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import type { BehaviorLog } from '@/lib/types';

interface TodayBehaviorCardProps {
  behavior: BehaviorLog | null;
}

export function TodayBehaviorCard({ behavior }: TodayBehaviorCardProps) {
  if (!behavior) {
    return (
      <Card className="py-6">
        <EmptyState
          icon={SmilePlus}
          title="No Behavior Log"
          description="No behavior report for today yet."
        />
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
    </Card>
  );
}
