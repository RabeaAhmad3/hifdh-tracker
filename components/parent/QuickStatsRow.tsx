import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressArc } from '@/components/ui/ProgressArc';

interface QuickStatsRowProps {
  weeklyPassed: number;
  weeklyTotal: number;
  currentJuz: number | null;
  monthlyPresent: number;
  monthlyTotal: number;
}

export function QuickStatsRow({
  weeklyPassed,
  weeklyTotal,
  currentJuz,
  monthlyPresent,
  monthlyTotal,
}: QuickStatsRowProps) {
  const juz = currentJuz ?? 0;
  const juzProgress = juz > 0 ? juz / 30 : 0;

  return (
    <View className="flex-row gap-3">
      <Card className="flex-1 items-center py-3 px-2">
        <Text className="font-body text-[12px] text-gray-400 mb-1">
          This Week
        </Text>
        <Text className="font-heading text-[20px] text-charcoal">
          {weeklyPassed}/{weeklyTotal}
        </Text>
        <Text className="font-body text-[11px] text-gray-400">passed</Text>
      </Card>

      <Card className="flex-1 items-center py-3 px-2">
        <Text className="font-body text-[12px] text-gray-400 mb-1">
          Current Juz
        </Text>
        <ProgressArc
          size={60}
          progress={juzProgress}
          label={juz > 0 ? String(juz) : '—'}
          strokeWidth={5}
        />
      </Card>

      <Card className="flex-1 items-center py-3 px-2">
        <Text className="font-body text-[12px] text-gray-400 mb-1">
          Attendance
        </Text>
        <Text className="font-heading text-[20px] text-charcoal">
          {monthlyPresent}/{monthlyTotal}
        </Text>
        <Text className="font-body text-[11px] text-gray-400">this month</Text>
      </Card>
    </View>
  );
}
