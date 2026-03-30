import { Pressable, Switch, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { DAY_LABELS_FULL, formatTime } from '@/lib/constants';
import type { TeacherAvailability } from '@/lib/types';

interface AvailabilitySlotCardProps {
  slot: TeacherAvailability;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function AvailabilitySlotCard({ slot, onToggle, onDelete }: AvailabilitySlotCardProps) {
  return (
    <View
      className={`mb-2 flex-row items-center rounded-card bg-white p-3 shadow-sm ${
        !slot.is_active ? 'opacity-50' : ''
      }`}
    >
      <View className="flex-1">
        <Text className="font-body-semibold text-[14px] text-charcoal">
          {DAY_LABELS_FULL[slot.day_of_week]}
        </Text>
        <Text className="mt-0.5 font-body text-[13px] text-gray-600">
          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
        </Text>
      </View>

      <Switch
        value={slot.is_active}
        onValueChange={(value) => onToggle(slot.id, value)}
        trackColor={{ false: colors.gray200, true: colors.primary }}
        thumbColor={colors.white}
      />

      <Pressable
        onPress={() => onDelete(slot.id)}
        className="ml-3 h-12 w-12 items-center justify-center"
        hitSlop={8}
      >
        <Trash2 size={18} color={colors.error} />
      </Pressable>
    </View>
  );
}
