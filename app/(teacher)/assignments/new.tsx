import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';

import { useAuth } from '@/lib/auth';
import { useStudents } from '@/hooks/useStudents';
import type { StudentWithStatus } from '@/hooks/useStudents';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { StudentRow } from '@/components/assignments/StudentRow';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { colors } from '@/lib/colors';

export default function NewAssignment() {
  const router = useRouter();
  const { profile } = useAuth();
  const { students, loading, searchQuery, setSearchQuery } = useStudents();

  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithStatus | null>(null);

  const handleBack = () => {
    if (selectedStudent != null) {
      setSelectedStudent(null);
      setSearchQuery('');
    } else {
      router.back();
    }
  };

  const renderStudentItem = useCallback(
    ({ item }: { item: StudentWithStatus }) => (
      <StudentRow
        student={item}
        onPress={() => setSelectedStudent(item)}
      />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: StudentWithStatus) => item.id,
    [],
  );

  const ItemSeparator = useCallback(
    () => <View className="h-3" />,
    [],
  );

  if (loading && students.length === 0 && selectedStudent == null) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <Pressable
          onPress={handleBack}
          className="h-12 w-12 items-center justify-center -ml-2"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>

        <Text className="font-heading text-[24px] text-charcoal">
          New Assignment
        </Text>

        {selectedStudent != null && (
          <Text className="font-body text-[15px] text-gray-600 mt-1">
            {selectedStudent.full_name}
          </Text>
        )}
      </View>

      {selectedStudent == null ? (
        /* Phase 1: Student picker */
        <>
          <View className="px-4 mb-3">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={students}
            renderItem={renderStudentItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={ItemSeparator}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            ListEmptyComponent={
              !loading ? (
                <View className="mt-16">
                  <EmptyState
                    icon={Users}
                    title="No Students"
                    description="No students found. Try a different search."
                  />
                </View>
              ) : null
            }
          />
        </>
      ) : (
        /* Phase 2: Assignment form (has its own date navigation) */
        profile != null && (
          <AssignmentForm
            studentId={selectedStudent.id}
            teacherId={profile.id}
            onSaved={() => router.back()}
          />
        )
      )}
    </SafeAreaView>
  );
}
