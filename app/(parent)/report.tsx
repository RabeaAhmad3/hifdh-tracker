import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { useStudentReport } from '@/hooks/useStudentReport';
import { useStudentComments } from '@/hooks/useStudentComments';
import { colors } from '@/lib/colors';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DateRangeSelector } from '@/components/reports/DateRangeSelector';
import { PassRateRow } from '@/components/reports/PassRateRow';
import { ProgressTrendChart } from '@/components/reports/ProgressTrendChart';
import { AttendanceSummaryBar } from '@/components/reports/AttendanceSummaryBar';
import { BehaviorSummaryChart } from '@/components/reports/BehaviorSummaryChart';
import { QuranProgressSection } from '@/components/reports/QuranProgressSection';
import { MonthlySummaryCard } from '@/components/reports/MonthlySummaryCard';
import { CommentsList } from '@/components/reports/CommentsList';

export default function ParentReportScreen() {
  const router = useRouter();
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
    loading: studentsLoading,
  } = useParentStudentContext();

  const {
    report,
    trends,
    attendanceSummary,
    behaviorSummary,
    startDate,
    endDate,
    dateRange,
    setDateRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    loading,
    refresh,
  } = useStudentReport(selectedStudent?.id ?? null);

  const {
    comments,
    loading: commentsLoading,
    hasMore,
    loadMore,
  } = useStudentComments(selectedStudent?.id ?? null, startDate, endDate);

  if (studentsLoading) {
    return <LoadingScreen />;
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
          {selectedStudent?.full_name ?? 'Report'}
        </Text>
      </View>

      <ScrollView
        className="px-4"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View className="mb-3">
          <ChildSelector
            students={students}
            selectedId={selectedStudent?.id ?? null}
            onSelect={setSelectedStudentId}
          />
        </View>

        <DateRangeSelector
          value={dateRange}
          onValueChange={setDateRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />

        <PassRateRow report={report} />
        <ProgressTrendChart trends={trends} />

        <QuranProgressSection
          currentJuz={selectedStudent?.current_juz ?? null}
          currentSurah={selectedStudent?.current_surah ?? null}
        />

        <MonthlySummaryCard
          report={report}
          attendance={attendanceSummary}
          behavior={behaviorSummary}
        />

        <AttendanceSummaryBar summary={attendanceSummary} />
        <BehaviorSummaryChart summary={behaviorSummary} />

        <CommentsList
          comments={comments}
          loading={commentsLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
