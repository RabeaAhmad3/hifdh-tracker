import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ATTENDANCE_STATUS_COLORS } from '@/lib/constants';
import type { AttendanceSummary } from '@/lib/types';

interface AttendanceSummaryBarProps {
  summary: AttendanceSummary;
}

export function AttendanceSummaryBar({ summary }: AttendanceSummaryBarProps) {
  const { present, absent, late, left_early, total } = summary;
  if (total === 0) return null;

  const pct = (n: number) => Math.round((n / total) * 100);

  const segments = [
    { value: present, color: ATTENDANCE_STATUS_COLORS.present, label: 'Present' },
    { value: late, color: ATTENDANCE_STATUS_COLORS.late, label: 'Late' },
    { value: left_early, color: ATTENDANCE_STATUS_COLORS.left_early, label: 'Left Early' },
    { value: absent, color: ATTENDANCE_STATUS_COLORS.absent, label: 'Absent' },
  ].filter((s) => s.value > 0);

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Attendance
      </Text>

      {/* Stats row */}
      <View className="flex-row justify-between mb-3">
        <StatItem value={present} label="Present" color={ATTENDANCE_STATUS_COLORS.present} />
        <StatItem value={absent} label="Absent" color={ATTENDANCE_STATUS_COLORS.absent} />
        <StatItem value={late} label="Late" color={ATTENDANCE_STATUS_COLORS.late} />
        <StatItem value={left_early} label="Left Early" color={ATTENDANCE_STATUS_COLORS.left_early} />
      </View>

      {/* Horizontal stacked bar */}
      <View className="h-4 rounded-full overflow-hidden flex-row">
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={{
              width: `${pct(seg.value)}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </View>
    </Card>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="items-center">
      <Text className="font-heading text-[18px]" style={{ color }}>
        {value}
      </Text>
      <Text className="font-body text-[11px] text-gray-600">{label}</Text>
    </View>
  );
}
