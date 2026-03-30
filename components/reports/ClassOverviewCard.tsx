import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';

interface ClassOverviewCardProps {
  title: string;
  children: React.ReactNode;
}

export function ClassOverviewCard({ title, children }: ClassOverviewCardProps) {
  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        {title}
      </Text>
      {children}
    </Card>
  );
}
