import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/lib/colors';
import type { StudentReport, AttendanceSummary, BehaviorSummary } from '@/lib/types';

interface MonthlySummaryCardProps {
  report: StudentReport;
  attendance: AttendanceSummary;
  behavior: BehaviorSummary;
}

export function MonthlySummaryCard({ report, attendance, behavior }: MonthlySummaryCardProps) {
  const totalPages =
    report.new_lesson.pages + report.previous_lesson.pages + report.revision.pages;
  const totalAssignments =
    report.new_lesson.total + report.previous_lesson.total + report.revision.total;
  const totalPassed =
    report.new_lesson.passed + report.previous_lesson.passed + report.revision.passed;
  const overallPassRate =
    totalAssignments > 0 ? Math.round((totalPassed / totalAssignments) * 100) : 0;
  const attendancePct =
    attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;

  // Compute average daily pages (unique assignment dates)
  const avgDailyPages = totalAssignments > 0
    ? Math.round(totalPages / Math.max(totalAssignments / 3, 1))
    : 0;

  const stats = [
    { label: 'Total Pages', value: `${totalPages}` },
    { label: 'Avg Daily Pages', value: `${avgDailyPages}` },
    { label: 'Assignments', value: `${totalAssignments}` },
    { label: 'Pass Rate', value: `${overallPassRate}%` },
    { label: 'Attendance', value: `${attendancePct}%` },
    {
      label: 'Behavior',
      value: behavior.total > 0
        ? `${Math.round((behavior.very_good / behavior.total) * 100)}% great`
        : '—',
    },
  ];

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Summary
      </Text>
      <View className="flex-row flex-wrap">
        {stats.map((stat) => (
          <View key={stat.label} className="w-1/2 py-2">
            <Text className="font-heading text-[20px] text-charcoal">
              {stat.value}
            </Text>
            <Text className="font-body text-[12px] text-gray-400">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
