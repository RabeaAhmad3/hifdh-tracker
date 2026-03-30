import { memo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MessageSquare, AlertCircle } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_COLORS } from '@/lib/constants';
import type { AttendanceStatus } from '@/lib/types';
import type { StudentWithStatus } from '@/hooks/useStudents';
import { Card } from '@/components/ui/Card';

interface AttendanceRowProps {
  student: StudentWithStatus;
  status: AttendanceStatus | null;
  notes: string;
  hasExcuse: boolean;
  onStatusChange: (status: AttendanceStatus | null) => void;
  onNotesChange: (text: string) => void;
}

export const AttendanceRow = memo(function AttendanceRow({
  student,
  status,
  notes,
  hasExcuse,
  onStatusChange,
  onNotesChange,
}: AttendanceRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const notesVisible = showNotes || !!notes;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Text className="font-body-semibold text-[15px] text-charcoal" numberOfLines={1}>
            {student.full_name}
          </Text>
          {hasExcuse && (
            <View className="ml-2 flex-row items-center">
              <AlertCircle size={14} color={colors.warning} />
              <Text className="font-body-medium text-[11px] text-warning ml-0.5">
                Excuse
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => setShowNotes((prev) => !prev)}
          className="h-10 w-10 items-center justify-center"
          hitSlop={4}
        >
          <MessageSquare
            size={18}
            color={notesVisible ? colors.primary : colors.gray400}
          />
        </Pressable>
      </View>

      {/* Status buttons */}
      <View className="flex-row gap-2">
        {ATTENDANCE_STATUSES.map(({ key, label }) => {
          const isActive = status === key;
          const color = ATTENDANCE_STATUS_COLORS[key];
          return (
            <Pressable
              key={key}
              onPress={() => onStatusChange(isActive ? null : key)}
              className={`flex-1 h-12 items-center justify-center rounded-button border ${
                isActive ? '' : 'border-gray-200 bg-white'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${color}20`,
                      borderColor: color,
                      borderWidth: 1,
                    }
                  : undefined
              }
            >
              <Text
                className={`font-body-medium text-[11px] text-center ${
                  isActive ? '' : 'text-gray-400'
                }`}
                style={isActive ? { color } : undefined}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notes input */}
      {notesVisible && (
        <TextInput
          className="mt-2 border border-gray-200 rounded-button p-3 font-body text-[14px] text-charcoal"
          placeholder="Optional notes..."
          placeholderTextColor={colors.gray400}
          value={notes}
          onChangeText={onNotesChange}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          style={{ minHeight: 60 }}
        />
      )}
    </Card>
  );
});
