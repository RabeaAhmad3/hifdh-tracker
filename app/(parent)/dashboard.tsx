import { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { subDays } from 'date-fns';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { useBehaviorHistory } from '@/hooks/useBehaviorHistory';
import { useAuth } from '@/lib/auth';
import { toDateString } from '@/lib/constants';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { TodayAssignmentCard } from '@/components/parent/TodayAssignmentCard';
import { TodayBehaviorCard } from '@/components/parent/TodayBehaviorCard';
import { TodayAttendanceCard } from '@/components/parent/TodayAttendanceCard';
import { QuickStatsRow } from '@/components/parent/QuickStatsRow';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function ParentDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
    loading: studentsLoading,
  } = useParentStudentContext();

  const {
    assignments,
    behavior,
    attendance,
    weeklyStats,
    monthlyAttendance,
    loading: dashboardLoading,
    error,
    refresh,
    markReviewed,
  } = useParentDashboard(selectedStudent?.id ?? null);

  const { entriesByDate } = useBehaviorHistory(selectedStudent?.id ?? null, 7);

  // Build weekHistory array for the last 7 days
  const weekHistory = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = toDateString(d);
      const entry = entriesByDate.get(dateStr);
      return { date: dateStr, rating: entry?.rating ?? null };
    });
  }, [entriesByDate]);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  if (studentsLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <ScrollView
        className="px-4 pt-2"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={dashboardLoading} onRefresh={refresh} />
        }
      >
        <Text className="font-arabic text-[13px] text-gray-400 text-center">
          بسم الله الرحمن الرحيم
        </Text>

        {error && (
          <View className="rounded-button bg-error/10 p-3 mt-2">
            <Text className="font-body text-[13px] text-error">{error}</Text>
          </View>
        )}

        <Text className="font-heading text-[24px] text-charcoal mt-1">
          Assalamu Alaikum, {firstName}
        </Text>

        <View className="mt-3">
          <ChildSelector
            students={students}
            selectedId={selectedStudent?.id ?? null}
            onSelect={setSelectedStudentId}
          />
        </View>

        <TodayAssignmentCard
          assignments={assignments}
          onMarkReviewed={markReviewed}
        />

        <SectionDivider />

        <TodayBehaviorCard
          behavior={behavior}
          weekHistory={weekHistory}
          onViewHistory={() => router.push('/(parent)/behavior-history')}
        />

        <View className="mt-3">
          <TodayAttendanceCard attendance={attendance} />
        </View>

        <View className="mt-6 mb-8">
          <QuickStatsRow
            weeklyPassed={weeklyStats.passed}
            weeklyTotal={weeklyStats.total}
            currentJuz={selectedStudent?.current_juz ?? null}
            monthlyPresent={monthlyAttendance.present}
            monthlyTotal={monthlyAttendance.total}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
