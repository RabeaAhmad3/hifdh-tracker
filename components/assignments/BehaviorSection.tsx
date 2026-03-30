import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { colors } from '@/lib/colors';
import type { BehaviorRating } from '@/lib/types';

interface BehaviorSectionProps {
  value: BehaviorRating | null;
  onChange: (rating: BehaviorRating) => void;
  notes: string;
  onNotesChange: (text: string) => void;
}

const ratings: { key: BehaviorRating; label: string }[] = [
  { key: 'very_good', label: 'Very Good' },
  { key: 'good', label: 'Good' },
  { key: 'needs_improvement', label: 'Needs Improvement' },
];

const ratingStyles: Record<
  BehaviorRating,
  { activeBg: string; activeText: string }
> = {
  very_good: { activeBg: colors.success, activeText: '#FFFFFF' },
  good: { activeBg: colors.accent, activeText: '#FFFFFF' },
  needs_improvement: { activeBg: colors.warning, activeText: '#FFFFFF' },
};

export const BehaviorSection = memo(function BehaviorSection({
  value,
  onChange,
  notes,
  onNotesChange,
}: BehaviorSectionProps) {
  return (
    <View>
      <Text className="font-body-semibold text-[18px] text-charcoal mb-3">
        Behavior
      </Text>

      <View className="flex-row gap-2 mb-4">
        {ratings.map(({ key, label }) => {
          const isActive = value === key;
          const style = ratingStyles[key];

          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              className={`flex-1 h-12 items-center justify-center rounded-button border ${
                isActive ? '' : 'border-gray-200 bg-white'
              }`}
              style={isActive ? { backgroundColor: style.activeBg } : undefined}
            >
              <Text
                className={`font-body-medium text-[13px] text-center ${
                  isActive ? '' : 'text-charcoal'
                }`}
                style={isActive ? { color: style.activeText } : undefined}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label="Notes (optional)"
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={onNotesChange}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{ minHeight: 80 }}
      />
    </View>
  );
});
