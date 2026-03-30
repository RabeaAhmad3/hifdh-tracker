import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { getPassRateColor } from '@/lib/constants';
import type { CategoryPassRate } from '@/lib/types';

interface PassRateCardProps {
  label: string;
  data: CategoryPassRate;
  /** Hide "X/Y passed" detail line (e.g. when only a percentage is available) */
  hideDetail?: boolean;
}

export function PassRateCard({ label, data, hideDetail }: PassRateCardProps) {
  const rateColor = getPassRateColor(data.pass_rate);

  return (
    <Card className="flex-1">
      <Text className="font-body-medium text-[12px] text-gray-600 mb-1">
        {label}
      </Text>
      <Text
        className="font-heading text-[28px]"
        style={{ color: rateColor }}
      >
        {data.pass_rate}%
      </Text>
      {!hideDetail && (
        <Text className="font-body text-[12px] text-gray-400 mt-1">
          {data.passed}/{data.total} passed
        </Text>
      )}
    </Card>
  );
}
