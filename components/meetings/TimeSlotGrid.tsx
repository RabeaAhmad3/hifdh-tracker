import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { formatTime } from '@/lib/constants';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TimeSlot } from '@/hooks/useMeetingScheduling';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  loading: boolean;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelectSlot, loading }: TimeSlotGridProps) {
  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View className="py-4">
        <EmptyState
          icon={Clock}
          title="No Available Slots"
          description="No time slots are available for this date."
        />
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.start_time === slot.start_time &&
          selectedSlot?.end_time === slot.end_time;

        return (
          <Pressable
            key={slot.start_time}
            onPress={() => onSelectSlot(slot)}
            className={`min-h-12 items-center justify-center rounded-button px-4 py-3 ${
              isSelected
                ? 'bg-primary'
                : 'border border-primary bg-primary/10'
            }`}
            style={{ width: '48%' }}
          >
            <Text
              className={`font-body-semibold text-[14px] ${
                isSelected ? 'text-white' : 'text-primary'
              }`}
            >
              {formatTime(slot.start_time)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
