import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { AssignmentCategory } from '@/lib/types';
import type { AssignmentWithStudent } from '@/hooks/useAssignments';

interface AssignmentHistoryRowProps {
  assignment: AssignmentWithStudent;
  onPress: () => void;
}

const categoryChipColors: Record<
  AssignmentCategory,
  { bg: string; text: string }
> = {
  new_lesson: {
    bg: `rgba(59,142,173,0.15)`,
    text: 'text-primary',
  },
  previous_lesson: {
    bg: `rgba(196,152,59,0.15)`,
    text: 'text-accent',
  },
  revision: {
    bg: `rgba(45,122,79,0.15)`,
    text: 'text-success',
  },
};

export const AssignmentHistoryRow = memo(function AssignmentHistoryRow({
  assignment,
  onPress,
}: AssignmentHistoryRowProps) {
  const chipColors = categoryChipColors[assignment.category];

  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row items-center">
        <Text className="font-body-semibold text-[15px] text-charcoal flex-1">
          {assignment.student_full_name}
        </Text>

        <View
          className="rounded-chip px-3 py-1"
          style={{ backgroundColor: chipColors.bg }}
        >
          <Text className={`font-body-medium text-[13px] ${chipColors.text}`}>
            {CATEGORY_LABELS[assignment.category]}
          </Text>
        </View>

        <Text className="font-body text-[13px] text-gray-600 ml-3 min-w-[50px] text-right">
          {assignment.pages_completed}{' '}
          {assignment.pages_completed === 1 ? 'page' : 'pages'}
        </Text>
      </Card>
    </Pressable>
  );
});
