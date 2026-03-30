import { memo } from 'react';
import { Text, View } from 'react-native';
import { format } from 'date-fns';
import { FileText } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Excuse } from '@/hooks/useBulkAttendance';
import type { StudentWithStatus } from '@/hooks/useStudents';

interface ExcusePanelProps {
  excuses: Excuse[];
  students: StudentWithStatus[];
}

export const ExcusePanel = memo(function ExcusePanel({ excuses, students }: ExcusePanelProps) {
  if (excuses.length === 0) {
    return (
      <View className="mt-4">
        <EmptyState
          icon={FileText}
          title="No Excuses"
          description="No parent excuses submitted for this date."
        />
      </View>
    );
  }

  const studentMap = new Map(students.map((s) => [s.id, s.full_name]));

  return (
    <View className="mt-4">
      <Text className="font-heading text-[16px] text-charcoal mb-2">
        Parent Excuses
      </Text>
      {excuses.map((excuse) => (
        <Card key={excuse.id} className="mb-2">
          <Text className="font-body-semibold text-[14px] text-charcoal">
            {studentMap.get(excuse.student_id) ?? 'Student'}
          </Text>
          {excuse.parent_name && (
            <Text className="font-body text-[12px] text-gray-400 mt-0.5">
              From: {excuse.parent_name}
            </Text>
          )}
          <Text className="font-body text-[13px] text-gray-600 mt-1">
            {excuse.reason}
          </Text>
          <Text className="font-body text-[11px] text-gray-400 mt-1">
            {format(new Date(excuse.created_at), 'MMM d, h:mm a')}
          </Text>
        </Card>
      ))}
    </View>
  );
});
