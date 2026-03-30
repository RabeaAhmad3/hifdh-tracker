import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/colors';
import type { TrendDataPoint } from '@/lib/types';

interface ProgressTrendChartProps {
  trends: TrendDataPoint[];
}

export function ProgressTrendChart({ trends }: ProgressTrendChartProps) {
  if (trends.length === 0) return null;

  // Group by date, compute daily pass rate per category
  const dateMap = new Map<string, { new_lesson: number[]; previous_lesson: number[]; revision: number[] }>();

  for (const t of trends) {
    if (!dateMap.has(t.date)) {
      dateMap.set(t.date, { new_lesson: [], previous_lesson: [], revision: [] });
    }
    const entry = dateMap.get(t.date)!;
    const cat = t.category as keyof typeof entry;
    if (entry[cat]) {
      entry[cat].push(t.passed ? 1 : 0);
    }
  }

  const dates = Array.from(dateMap.keys()).sort();
  const avg = (arr: number[]) => (arr.length === 0 ? 0 : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100));

  const newLessonData = dates.map((d) => ({
    value: avg(dateMap.get(d)!.new_lesson),
    label: format(parseISO(d), 'M/d'),
  }));

  const prevLessonData = dates.map((d) => ({
    value: avg(dateMap.get(d)!.previous_lesson),
  }));

  const revisionData = dates.map((d) => ({
    value: avg(dateMap.get(d)!.revision),
  }));

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Pass Rate Trend
      </Text>

      {/* Legend */}
      <View className="flex-row gap-4 mb-2">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
          <Text className="font-body text-[11px] text-gray-600">New</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }} />
          <Text className="font-body text-[11px] text-gray-600">Previous</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.coral }} />
          <Text className="font-body text-[11px] text-gray-600">Revision</Text>
        </View>
      </View>

      <LineChart
        data={newLessonData}
        data2={prevLessonData}
        data3={revisionData}
        color1={colors.primary}
        color2={colors.accent}
        color3={colors.coral}
        height={160}
        noOfSections={4}
        maxValue={100}
        yAxisTextStyle={{ fontSize: 10, color: colors.gray400 }}
        xAxisLabelTextStyle={{ fontSize: 9, color: colors.gray400 }}
        spacing={50}
        curved
        thickness={2}
        hideDataPoints
        yAxisColor={colors.gray200}
        xAxisColor={colors.gray200}
        rulesColor={colors.gray100}
        backgroundColor={colors.white}
        isAnimated
      />
    </Card>
  );
}
