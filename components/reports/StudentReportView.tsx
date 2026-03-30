import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useStudentReport } from '@/hooks/useStudentReport';
import { useStudentComments } from '@/hooks/useStudentComments';
import { DATE_RANGE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { shareReport } from '@/lib/reportExport';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { BarChart3 } from 'lucide-react-native';
import { DateRangeSelector } from './DateRangeSelector';
import { PassRateRow } from './PassRateRow';
import { ProgressTrendChart } from './ProgressTrendChart';
import { MistakePauseTrendChart } from './MistakePauseTrendChart';
import { AttendanceSummaryBar } from './AttendanceSummaryBar';
import { BehaviorSummaryChart } from './BehaviorSummaryChart';
import { CommentsList } from './CommentsList';

interface StudentReportViewProps {
  studentId: string;
  studentName?: string;
}

export function StudentReportView({ studentId, studentName }: StudentReportViewProps) {
  const [sharing, setSharing] = useState(false);
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
    error,
    refresh,
  } = useStudentReport(studentId);

  const {
    comments,
    loading: commentsLoading,
    hasMore,
    loadMore,
  } = useStudentComments(studentId, startDate, endDate);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const rangeLabel =
        dateRange === 'custom'
          ? `${format(customStart, 'MMM d')} – ${format(customEnd, 'MMM d, yyyy')}`
          : DATE_RANGE_LABELS[dateRange];
      await shareReport({
        studentName: studentName ?? 'Student',
        dateRangeLabel: rangeLabel,
        report,
        attendance: attendanceSummary,
        behavior: behaviorSummary,
      });
    } catch {
      // User cancelled sharing or print failed — non-critical
    } finally {
      setSharing(false);
    }
  }, [dateRange, customStart, customEnd, studentName, report, attendanceSummary, behaviorSummary]);

  if (loading && report.new_lesson.total === 0) {
    return <LoadingScreen />;
  }

  const hasData =
    report.new_lesson.total > 0 ||
    report.previous_lesson.total > 0 ||
    report.revision.total > 0 ||
    attendanceSummary.total > 0 ||
    behaviorSummary.total > 0;

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="pb-10 pt-2"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <DateRangeSelector
        value={dateRange}
        onValueChange={setDateRange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      {!hasData ? (
        <View className="mt-10">
          <EmptyState
            icon={BarChart3}
            title="No Data Yet"
            description="No assignments, attendance, or behavior records found for this date range."
          />
        </View>
      ) : (
        <>
          <PassRateRow report={report} />
          <ProgressTrendChart trends={trends} />
          <MistakePauseTrendChart trends={trends} />
          <AttendanceSummaryBar summary={attendanceSummary} />
          <BehaviorSummaryChart summary={behaviorSummary} />
          <CommentsList
            comments={comments}
            loading={commentsLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />

          <View className="mt-2 mb-4">
            <Button variant="secondary" loading={sharing} onPress={handleShare}>
              Share Report
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}
