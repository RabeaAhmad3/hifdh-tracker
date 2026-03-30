import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Card } from '@/components/ui/Card';
import { RATING_COLORS } from '@/lib/constants';
import type { BehaviorSummary } from '@/lib/types';

interface BehaviorSummaryChartProps {
  summary: BehaviorSummary;
}

export function BehaviorSummaryChart({ summary }: BehaviorSummaryChartProps) {
  const { very_good, good, needs_improvement, total } = summary;
  if (total === 0) return null;

  const pieData = [
    { value: very_good, color: RATING_COLORS.very_good, text: `${very_good}` },
    { value: good, color: RATING_COLORS.good, text: `${good}` },
    { value: needs_improvement, color: RATING_COLORS.needs_improvement, text: `${needs_improvement}` },
  ].filter((d) => d.value > 0);

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Behavior
      </Text>

      <View className="flex-row items-center">
        <PieChart
          data={pieData}
          radius={60}
          innerRadius={35}
          centerLabelComponent={() => (
            <Text className="font-heading text-[18px] text-charcoal">{total}</Text>
          )}
        />

        <View className="ml-6 gap-2">
          <LegendItem color={RATING_COLORS.very_good} label="Very Good" count={very_good} />
          <LegendItem color={RATING_COLORS.good} label="Good" count={good} />
          <LegendItem color={RATING_COLORS.needs_improvement} label="Needs Improvement" count={needs_improvement} />
        </View>
      </View>
    </Card>
  );
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-body text-[13px] text-gray-600">
        {label}: {count}
      </Text>
    </View>
  );
}
