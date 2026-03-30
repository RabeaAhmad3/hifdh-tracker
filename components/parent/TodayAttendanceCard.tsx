import { View, Text } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Attendance } from '@/lib/types';

interface TodayAttendanceCardProps {
  attendance: Attendance | null;
}

export function TodayAttendanceCard({ attendance }: TodayAttendanceCardProps) {
  if (!attendance) {
    return (
      <Card className="py-6">
        <EmptyState
          icon={CalendarDays}
          title="No Attendance"
          description="Attendance hasn't been recorded yet today."
        />
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-heading text-[16px] text-charcoal">
          Attendance
        </Text>
        <StatusChip status={attendance.status} />
      </View>
      {attendance.notes && (
        <Text className="font-body text-[14px] text-gray-600">
          {attendance.notes}
        </Text>
      )}
    </Card>
  );
}
