import { View, Text } from 'react-native';
import type { PassStatus, BehaviorRating, AttendanceStatus } from '@/lib/types';
import { colors } from '@/lib/colors';
import { formatLabel } from '@/lib/constants';

type Status = PassStatus | BehaviorRating | AttendanceStatus;

interface StatusChipProps {
  status: Status;
  label?: string;
}

const colorMap: Record<Status, { bg: string; text: string }> = {
  pass: { bg: `rgba(45,122,79,0.15)`, text: 'text-success' },
  very_good: { bg: `rgba(45,122,79,0.15)`, text: 'text-success' },
  present: { bg: `rgba(45,122,79,0.15)`, text: 'text-success' },
  not_pass: { bg: `rgba(192,57,43,0.15)`, text: 'text-error' },
  absent: { bg: `rgba(192,57,43,0.15)`, text: 'text-error' },
  good: { bg: colors.accentLight, text: 'text-accent' },
  needs_improvement: { bg: `rgba(212,146,42,0.15)`, text: 'text-warning' },
  late: { bg: `rgba(212,146,42,0.15)`, text: 'text-warning' },
  left_early: { bg: `rgba(212,146,42,0.15)`, text: 'text-warning' },
};

export function StatusChip({ status, label }: StatusChipProps) {
  const chipColors = colorMap[status];

  return (
    <View className="rounded-chip px-3 py-1" style={{ backgroundColor: chipColors.bg }}>
      <Text className={`font-body-medium text-[13px] ${chipColors.text}`}>
        {label ?? formatLabel(status)}
      </Text>
    </View>
  );
}
