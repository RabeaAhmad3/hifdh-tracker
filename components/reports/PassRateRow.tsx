import { View } from 'react-native';
import { PassRateCard } from './PassRateCard';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { StudentReport } from '@/lib/types';

interface PassRateRowProps {
  report: StudentReport;
}

export function PassRateRow({ report }: PassRateRowProps) {
  return (
    <View className="flex-row gap-3 mb-4">
      <PassRateCard label={CATEGORY_LABELS.new_lesson} data={report.new_lesson} />
      <PassRateCard label={CATEGORY_LABELS.previous_lesson} data={report.previous_lesson} />
      <PassRateCard label={CATEGORY_LABELS.revision} data={report.revision} />
    </View>
  );
}
