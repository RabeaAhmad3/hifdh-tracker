import { Pressable, View, Text } from 'react-native';
import { CalendarDays, Check } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors } from '@/lib/colors';
import type { AbsenceExcuse, Attendance } from '@/lib/types';

interface TodayAttendanceCardProps {
  attendance: Attendance | null;
  excuse?: AbsenceExcuse | null;
  onSubmitExcuse?: () => void;
}

export function TodayAttendanceCard({ attendance, excuse, onSubmitExcuse }: TodayAttendanceCardProps) {
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

      {/* Excuse prompt/status */}
      {attendance.status === 'absent' && !excuse && onSubmitExcuse && (
        <Pressable onPress={onSubmitExcuse} className="mt-2 h-12 justify-center" hitSlop={4}>
          <Text className="font-body-medium text-[13px] text-warning">
            Submit an excuse →
          </Text>
        </Pressable>
      )}
      {attendance.status === 'absent' && excuse && (
        <View className="flex-row items-center mt-2">
          <Check size={14} color={colors.success} />
          <Text className="font-body-medium text-[13px] text-success ml-1">
            Excuse submitted
          </Text>
        </View>
      )}
    </Card>
  );
}
