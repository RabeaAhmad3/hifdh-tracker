import { Pressable, ScrollView, Text } from 'react-native';
import type { Student } from '@/lib/types';

interface ChildSelectorProps {
  students: Student[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChildSelector({
  students,
  selectedId,
  onSelect,
}: ChildSelectorProps) {
  if (students.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-3"
      contentContainerClassName="gap-2"
    >
      {students.map((student) => {
        const isActive = student.id === selectedId;
        return (
          <Pressable
            key={student.id}
            onPress={() => onSelect(student.id)}
            className={`min-h-[48px] items-center justify-center rounded-chip px-4 py-2 ${
              isActive ? 'bg-primary' : 'bg-primary-light'
            }`}
          >
            <Text
              className={`font-body-medium text-[14px] ${
                isActive ? 'text-white' : 'text-primary'
              }`}
            >
              {student.full_name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
