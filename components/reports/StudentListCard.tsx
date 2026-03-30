import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { ClassOverviewCard } from './ClassOverviewCard';
import { colors } from '@/lib/colors';

interface StudentItem {
  id: string;
  full_name: string;
}

interface StudentListCardProps {
  title: string;
  students: StudentItem[];
  onStudentPress: (id: string) => void;
  maxVisible?: number;
}

export function StudentListCard({
  title,
  students,
  onStudentPress,
  maxVisible = 5,
}: StudentListCardProps) {
  if (students.length === 0) return null;

  const visible = students.slice(0, maxVisible);
  const remaining = students.length - maxVisible;

  return (
    <ClassOverviewCard title={title}>
      {visible.map((student, index) => (
        <Pressable
          key={student.id}
          onPress={() => onStudentPress(student.id)}
          className={`flex-row items-center justify-between py-3 min-h-12 ${
            index > 0 ? 'border-t border-gray-100' : ''
          }`}
        >
          <Text className="font-body text-[14px] text-charcoal">
            {student.full_name}
          </Text>
          <ChevronRight size={16} color={colors.gray400} />
        </Pressable>
      ))}
      {remaining > 0 && (
        <Text className="font-body text-[13px] text-gray-400 mt-2">
          +{remaining} more
        </Text>
      )}
    </ClassOverviewCard>
  );
}
