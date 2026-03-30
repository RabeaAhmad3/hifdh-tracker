import { useState } from 'react';
import { View, Text } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { CardHeaderOrnament } from '@/components/ui/CardHeaderOrnament';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssignmentDetailRow } from '@/components/parent/AssignmentDetailRow';
import { CATEGORY_LABELS } from '@/lib/constants';
import { colors } from '@/lib/colors';
import type { Assignment } from '@/lib/types';

interface TodayAssignmentCardProps {
  assignments: Assignment[];
  onMarkReviewed: (ids: string[]) => Promise<{ error: string | null }>;
}

export function TodayAssignmentCard({
  assignments,
  onMarkReviewed,
}: TodayAssignmentCardProps) {
  const [reviewing, setReviewing] = useState(false);

  const allReviewed =
    assignments.length > 0 && assignments.every((a) => a.parent_reviewed);
  const unreviewedIds = assignments
    .filter((a) => !a.parent_reviewed)
    .map((a) => a.id);

  // Find next assignment text from any assignment that has it
  const nextAssignment = assignments.find((a) => a.next_assignment)?.next_assignment;

  const handleMarkReviewed = async () => {
    if (unreviewedIds.length === 0) return;
    setReviewing(true);
    await onMarkReviewed(unreviewedIds);
    setReviewing(false);
  };

  if (assignments.length === 0) {
    return (
      <Card className="py-8">
        <EmptyState
          icon={BookOpen}
          title="No Assignments Today"
          description="Your child's teacher hasn't posted assignments yet."
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeaderOrnament />
      <View className="p-4">
        <Text className="font-heading text-[18px] text-charcoal mb-3">
          Today's Assignments
        </Text>

        {assignments.map((assignment) => (
          <View key={assignment.id} className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-body-semibold text-[15px] text-charcoal">
                {CATEGORY_LABELS[assignment.category]}
              </Text>
              {assignment.status && (
                <StatusChip status={assignment.status} />
              )}
            </View>

            <AssignmentDetailRow assignment={assignment} />
          </View>
        ))}

        {nextAssignment && (
          <View
            className="rounded-button p-3 mt-1"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Text className="font-body-medium text-[13px] text-primary">
              Next Assignment
            </Text>
            <Text className="font-body text-[14px] text-charcoal mt-1">
              {nextAssignment}
            </Text>
          </View>
        )}

        <View className="mt-4">
          {allReviewed ? (
            <View
              className="rounded-button px-4 py-3 items-center"
              style={{ backgroundColor: 'rgba(45,122,79,0.15)' }}
            >
              <Text className="font-body-medium text-[14px] text-success">
                {assignments[0].parent_reviewed_at
                  ? `Reviewed on ${format(new Date(assignments[0].parent_reviewed_at), 'MMM d')}`
                  : 'Reviewed'}
              </Text>
            </View>
          ) : (
            <Button
              variant="primary"
              onPress={handleMarkReviewed}
              loading={reviewing}
            >
              Mark as Reviewed
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
}
