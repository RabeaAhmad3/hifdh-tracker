import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useClassOverview } from '@/hooks/useClassOverview';
import { ProgressArc } from '@/components/ui/ProgressArc';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ClassOverviewCard } from '@/components/reports/ClassOverviewCard';
import { StudentListCard } from '@/components/reports/StudentListCard';
import { PassRateCard } from '@/components/reports/PassRateCard';
import { colors } from '@/lib/colors';

export default function TeacherDashboard() {
  const router = useRouter();
  const { overview, totalStudents, loading, error, refresh } = useClassOverview();

  if (loading && overview.today_attendance.total === 0) {
    return <LoadingScreen />;
  }

  const { today_attendance, students_without_assignments_today, weekly_pass_rates, pending_excuses } = overview;
  const attendanceProgress = today_attendance.total > 0
    ? today_attendance.present / today_attendance.total
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <ScrollView
        className="px-4 pt-2"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <Text className="font-arabic text-[13px] text-gray-400 text-center">
          بسم الله الرحمن الرحيم
        </Text>

        <Text className="font-heading text-[24px] text-charcoal mt-1 mb-4">
          Class Dashboard
        </Text>

        {error && (
          <View className="rounded-button bg-error/10 p-3 mb-4">
            <Text className="font-body text-[13px] text-error">{error}</Text>
          </View>
        )}

        {/* Today's Attendance */}
        <ClassOverviewCard title="Today's Attendance">
          <View className="items-center">
            <ProgressArc
              size={100}
              progress={attendanceProgress}
              label={`${today_attendance.present}/${today_attendance.total}`}
              strokeWidth={8}
            />
            <Text className="font-body text-[13px] text-gray-600 mt-2">
              {totalStudents} total students
            </Text>
          </View>
        </ClassOverviewCard>

        {/* Students Without Assignments */}
        <StudentListCard
          title="Need Assignments Today"
          students={students_without_assignments_today}
          onStudentPress={(id) => router.push(`/(teacher)/students/${id}`)}
        />

        {/* Weekly Pass Rates */}
        <ClassOverviewCard title="Weekly Pass Rates">
          <View className="flex-row gap-3">
            <PassRateCard
              label="New Lesson"
              data={{ total: 0, passed: 0, pass_rate: weekly_pass_rates.new_lesson, pages: 0 }}
              hideDetail
            />
            <PassRateCard
              label="Previous"
              data={{ total: 0, passed: 0, pass_rate: weekly_pass_rates.previous_lesson, pages: 0 }}
              hideDetail
            />
            <PassRateCard
              label="Revision"
              data={{ total: 0, passed: 0, pass_rate: weekly_pass_rates.revision, pages: 0 }}
              hideDetail
            />
          </View>
        </ClassOverviewCard>

        {/* Pending Excuses */}
        {pending_excuses > 0 && (
          <ClassOverviewCard title="Pending Excuses">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-[15px] text-charcoal">
                {pending_excuses} excuse{pending_excuses !== 1 ? 's' : ''} to review
              </Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${colors.warning}20` }}>
                <Text className="font-body-medium text-[13px]" style={{ color: colors.warning }}>
                  Review
                </Text>
              </View>
            </View>
          </ClassOverviewCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
