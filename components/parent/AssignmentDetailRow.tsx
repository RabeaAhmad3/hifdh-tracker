import { Text } from 'react-native';
import type { Assignment } from '@/lib/types';

interface AssignmentDetailRowProps {
  assignment: Assignment;
  showPages?: boolean;
}

export function AssignmentDetailRow({
  assignment,
  showPages = false,
}: AssignmentDetailRowProps) {
  return (
    <>
      {assignment.surah_name && (
        <Text className="font-body text-[14px] text-gray-600">
          {assignment.surah_name}
          {assignment.start_ayah != null &&
            ` — Ayah ${assignment.start_ayah}`}
          {assignment.end_ayah != null &&
            assignment.end_ayah !== assignment.start_ayah &&
            `-${assignment.end_ayah}`}
        </Text>
      )}

      {showPages && assignment.pages_completed > 0 && (
        <Text className="font-body text-[13px] text-gray-600 mt-1">
          {assignment.pages_completed} page
          {assignment.pages_completed !== 1 ? 's' : ''} completed
        </Text>
      )}

      {(assignment.mistakes > 0 || assignment.pauses > 0) && (
        <Text className="font-body text-[13px] text-gray-400 mt-1">
          {assignment.mistakes > 0 &&
            `${assignment.mistakes} mistake${assignment.mistakes !== 1 ? 's' : ''}`}
          {assignment.mistakes > 0 && assignment.pauses > 0 && ' · '}
          {assignment.pauses > 0 &&
            `${assignment.pauses} pause${assignment.pauses !== 1 ? 's' : ''}`}
        </Text>
      )}

      {assignment.notes && (
        <Text className="font-body text-[13px] text-gray-600 mt-1 italic">
          {assignment.notes}
        </Text>
      )}
    </>
  );
}
