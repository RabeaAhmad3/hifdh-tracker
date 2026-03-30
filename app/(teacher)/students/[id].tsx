import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { STUDENT_COLUMNS } from '@/lib/constants';
import type { Student } from '@/lib/types';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { BehaviorTimeline } from '@/components/behavior/BehaviorTimeline';
import { StudentReportView } from '@/components/reports/StudentReportView';
import { useBehaviorHistory } from '@/hooks/useBehaviorHistory';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function StudentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignment' | 'behavior' | 'reports'>('assignment');

  const {
    entries: behaviorEntries,
    entriesByDate: behaviorByDate,
    loading: behaviorLoading,
  } = useBehaviorHistory(activeTab === 'behavior' ? (id ?? null) : null);

  const fetchStudent = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('students')
        .select(STUDENT_COLUMNS)
        .eq('id', id)
        .single();

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      setStudent(data as Student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error != null || student == null) {
    return (
      <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
        <View className="px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.charcoal} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="font-body text-[15px] text-error text-center">
            {error ?? 'Student not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center -ml-2"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>

        <Text className="font-heading text-[24px] text-charcoal">
          {student.full_name}
        </Text>

        {student.arabic_name != null && (
          <Text className="font-arabic text-[20px] text-gray-600 mt-1">
            {student.arabic_name}
          </Text>
        )}

        {(student.current_surah != null || student.current_juz != null) && (
          <View className="flex-row items-center mt-1 gap-3">
            {student.current_surah != null && (
              <Text className="font-body text-[14px] text-gray-600">
                Surah: {student.current_surah}
              </Text>
            )}
            {student.current_juz != null && (
              <Text className="font-body text-[14px] text-gray-600">
                Juz: {student.current_juz}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Tab Switcher */}
      <View className="flex-row px-4 mb-2 gap-2">
        {(['assignment', 'behavior', 'reports'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 h-12 items-center justify-center rounded-button ${
              activeTab === tab ? 'bg-primary' : 'border border-gray-200'
            }`}
          >
            <Text
              className={`font-body-medium text-[14px] ${
                activeTab === tab ? 'text-white' : 'text-charcoal'
              }`}
            >
              {tab === 'assignment' ? 'Assignment' : tab === 'behavior' ? 'Behavior' : 'Reports'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'assignment' ? (
        profile != null && (
          <AssignmentForm
            studentId={student.id}
            teacherId={profile.id}
            onSaved={() => router.back()}
          />
        )
      ) : activeTab === 'behavior' ? (
        <ScrollView className="flex-1 px-4" contentContainerClassName="pb-10 pt-2">
          <BehaviorTimeline
            entries={behaviorEntries}
            entriesByDate={behaviorByDate}
            loading={behaviorLoading}
          />
        </ScrollView>
      ) : (
        <StudentReportView studentId={student.id} studentName={student.full_name} />
      )}
    </SafeAreaView>
  );
}
