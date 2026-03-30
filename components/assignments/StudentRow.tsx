import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import type { StudentWithStatus } from '@/hooks/useStudents';

interface StudentRowProps {
  student: StudentWithStatus;
  onPress: () => void;
}

export const StudentRow = memo(function StudentRow({ student, onPress }: StudentRowProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row items-center">
        <Avatar name={student.full_name} size="md" />

        <View className="ml-3 flex-1">
          <Text className="font-body-semibold text-[15px] text-charcoal">
            {student.full_name}
          </Text>
          {student.current_surah != null && (
            <Text className="font-arabic text-[14px] text-gray-600 mt-0.5">
              {student.current_surah}
            </Text>
          )}
        </View>

        <View
          className={`h-3 w-3 rounded-full ${
            student.hasAssignmentToday ? 'bg-success' : 'bg-gray-400'
          }`}
        />
      </Card>
    </Pressable>
  );
});
