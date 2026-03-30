import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from 'lucide-react-native';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { useParentAssignmentHistory } from '@/hooks/useParentAssignmentHistory';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { AssignmentDetailRow } from '@/components/parent/AssignmentDetailRow';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CATEGORY_LABELS } from '@/lib/constants';
import { colors } from '@/lib/colors';
import type { Assignment, AssignmentCategory } from '@/lib/types';

const CATEGORIES: (AssignmentCategory | null)[] = [
  null,
  'new_lesson',
  'previous_lesson',
  'revision',
];

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  all: 'All',
  new_lesson: 'New Lesson',
  previous_lesson: 'Previous',
  revision: 'Revision',
};

export default function ParentAssignments() {
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
    loading: studentsLoading,
  } = useParentStudentContext();

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState<
    AssignmentCategory | undefined
  >(undefined);

  const { groups, loading, refresh } = useParentAssignmentHistory(
    selectedStudent?.id ?? null,
    weekAnchor,
    categoryFilter,
  );

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 0 });
  const weekLabel = format(weekStart, 'MMM d');

  const goBack = useCallback(() => setWeekAnchor((d) => addWeeks(d, -1)), []);
  const goForward = useCallback(
    () => setWeekAnchor((d) => addWeeks(d, 1)),
    [],
  );

  const sections = useMemo(
    () =>
      groups.map((group) => ({
        title: group.displayDate,
        date: group.date,
        reviewed: group.assignments.every((a) => a.parent_reviewed),
        data: group.assignments,
      })),
    [groups],
  );

  if (studentsLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4">
        <Text className="font-heading text-[22px] text-charcoal">
          Assignments
        </Text>

        <View className="mt-2">
          <ChildSelector
            students={students}
            selectedId={selectedStudent?.id ?? null}
            onSelect={setSelectedStudentId}
          />
        </View>

        {/* Week navigator */}
        <View className="flex-row items-center justify-between mt-2 mb-3">
          <Pressable
            onPress={goBack}
            className="h-12 w-12 items-center justify-center"
          >
            <ChevronLeft size={24} color={colors.charcoal} />
          </Pressable>
          <Text className="font-body-semibold text-[15px] text-charcoal">
            Week of {weekLabel}
          </Text>
          <Pressable
            onPress={goForward}
            className="h-12 w-12 items-center justify-center"
          >
            <ChevronRight size={24} color={colors.charcoal} />
          </Pressable>
        </View>

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerClassName="gap-2"
        >
          {CATEGORIES.map((cat) => {
            const key = cat ?? 'all';
            const isActive = cat === (categoryFilter ?? null);
            return (
              <Pressable
                key={key}
                onPress={() => setCategoryFilter(cat ?? undefined)}
                className={`min-h-[48px] items-center justify-center rounded-chip px-4 py-2 ${
                  isActive ? 'bg-primary' : 'bg-primary-light'
                }`}
              >
                <Text
                  className={`font-body-medium text-[13px] ${
                    isActive ? 'text-white' : 'text-primary'
                  }`}
                >
                  {CATEGORY_FILTER_LABELS[key]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Assignment list */}
      {loading ? (
        <LoadingScreen />
      ) : sections.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon={BookOpen}
            title="No Assignments"
            description="No assignments found for this week."
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-10"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center mt-4 mb-2">
              <Text className="font-body-semibold text-[15px] text-charcoal flex-1">
                {section.title}
              </Text>
              {section.reviewed && (
                <CheckCircle size={16} color={colors.success} />
              )}
            </View>
          )}
          renderItem={({ item }) => <AssignmentRow assignment={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View
          className="rounded-chip px-3 py-1"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <Text className="font-body-medium text-[12px] text-primary">
            {CATEGORY_LABELS[assignment.category]}
          </Text>
        </View>
        {assignment.status && <StatusChip status={assignment.status} />}
      </View>

      <AssignmentDetailRow assignment={assignment} showPages />

      {assignment.parent_reviewed && assignment.parent_reviewed_at && (
        <Text className="font-body text-[12px] text-success mt-2">
          Reviewed on{' '}
          {format(new Date(assignment.parent_reviewed_at), 'MMM d')}
        </Text>
      )}
    </Card>
  );
}
