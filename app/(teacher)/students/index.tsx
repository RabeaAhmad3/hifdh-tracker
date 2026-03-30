import { useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';

import { useStudents } from '@/hooks/useStudents';
import type { StudentWithStatus } from '@/hooks/useStudents';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { StudentRow } from '@/components/assignments/StudentRow';
import { colors } from '@/lib/colors';

export default function StudentList() {
  const router = useRouter();
  const { students, loading, error, refresh, searchQuery, setSearchQuery } =
    useStudents();

  const renderItem = useCallback(
    ({ item }: { item: StudentWithStatus }) => (
      <StudentRow
        student={item}
        onPress={() => router.push(`/(teacher)/students/${item.id}`)}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: StudentWithStatus) => item.id, []);

  const ItemSeparator = useCallback(
    () => <View className="h-3" />,
    [],
  );

  if (loading && students.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="font-heading text-[24px] text-charcoal mb-3">
          Students
        </Text>
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error != null && (
        <View className="px-4 mb-2">
          <Text className="font-body text-[14px] text-error">{error}</Text>
        </View>
      )}

      <FlatList
        data={students}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-16">
              <EmptyState
                icon={Users}
                title="No Students"
                description="No students found. Students will appear here once they are added."
              />
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6">
        <Pressable
          onPress={() => router.push('/(teacher)/assignments/new')}
          className="h-14 w-14 rounded-full bg-primary items-center justify-center shadow-md"
          style={{ elevation: 4 }}
        >
          <Plus size={24} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
