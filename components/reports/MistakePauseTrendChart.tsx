import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/colors';
import type { TrendDataPoint } from '@/lib/types';

interface MistakePauseTrendChartProps {
  trends: TrendDataPoint[];
}

export function MistakePauseTrendChart({ trends }: MistakePauseTrendChartProps) {
  if (trends.length === 0) return null;

  // Aggregate by date: sum mistakes and pauses per day
  const dateMap = new Map<string, { mistakes: number; pauses: number }>();
  for (const t of trends) {
    const entry = dateMap.get(t.date) ?? { mistakes: 0, pauses: 0 };
    entry.mistakes += t.mistakes;
    entry.pauses += t.pauses;
    dateMap.set(t.date, entry);
  }

  const dates = Array.from(dateMap.keys()).sort();
  const barData = dates.flatMap((d) => {
    const entry = dateMap.get(d)!;
    return [
      {
        value: entry.mistakes,
        label: format(parseISO(d), 'M/d'),
        frontColor: colors.error,
        spacing: 2,
      },
      {
        value: entry.pauses,
        frontColor: colors.warning,
        spacing: 18,
      },
    ];
  });

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Mistakes & Pauses
      </Text>

      {/* Legend */}
      <View className="flex-row gap-4 mb-2">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.error }} />
          <Text className="font-body text-[11px] text-gray-600">Mistakes</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.warning }} />
          <Text className="font-body text-[11px] text-gray-600">Pauses</Text>
        </View>
      </View>

      <BarChart
        data={barData}
        height={140}
        barWidth={12}
        noOfSections={4}
        yAxisTextStyle={{ fontSize: 10, color: colors.gray400 }}
        xAxisLabelTextStyle={{ fontSize: 9, color: colors.gray400 }}
        yAxisColor={colors.gray200}
        xAxisColor={colors.gray200}
        rulesColor={colors.gray100}
        backgroundColor={colors.white}
        isAnimated
      />
    </Card>
  );
}
