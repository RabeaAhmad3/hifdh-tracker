import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useStudents, type StudentWithStatus } from '@/hooks/useStudents';
import { useBulkBehavior } from '@/hooks/useBulkBehavior';
import { toDateString, RATING_COLORS } from '@/lib/constants';
import { colors } from '@/lib/colors';
import type { BehaviorRating } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateNavigator } from '@/components/ui/DateNavigator';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/components/ui/Toast';

const ratings: { key: BehaviorRating; label: string }[] = [
  { key: 'very_good', label: 'Very Good' },
  { key: 'good', label: 'Good' },
  { key: 'needs_improvement', label: 'Needs Imp.' },
];

const ItemSeparator = () => <View className="h-2" />;

export default function TeacherAttendance() {
  const { profile } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const [date, setDate] = useState(new Date());
  const dateStr = toDateString(date);
  const toast = useToast();

  const {
    entries,
    setEntry,
    setNotes,
    saving,
    loading: behaviorLoading,
    saveAll,
  } = useBulkBehavior(dateStr, profile?.id ?? '');

  const handleSave = useCallback(async () => {
    const { error } = await saveAll();
    if (error) {
      toast.show(error, 'error');
    } else {
      toast.show('Behavior saved', 'success');
    }
  }, [saveAll, toast]);

  const renderStudent = useCallback(
    ({ item }: { item: StudentWithStatus }) => (
      <BehaviorRow
        student={item}
        rating={entries.get(item.id)?.rating ?? null}
        notes={entries.get(item.id)?.notes ?? ''}
        onRatingChange={(rating) => setEntry(item.id, rating)}
        onNotesChange={(text) => setNotes(item.id, text)}
      />
    ),
    [entries, setEntry, setNotes],
  );

  if (studentsLoading || behaviorLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-1">
        <Text className="font-heading text-[24px] text-charcoal">
          Attendance
        </Text>
        <Text className="font-body text-[14px] text-gray-400 mt-1">
          Attendance marking coming soon
        </Text>
      </View>

      <SectionDivider />

      <View className="px-4 pt-2">
        <Text className="font-heading text-[18px] text-charcoal mb-2">
          Daily Behavior
        </Text>
        <DateNavigator date={date} onChange={setDate} />
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerClassName="px-4 pb-24 pt-2"
        ItemSeparatorComponent={ItemSeparator}
      />

      {/* Sticky save button */}
      <View className="absolute bottom-0 left-0 right-0 bg-offwhite px-4 pb-6 pt-3 border-t border-gray-100">
        <Button onPress={handleSave} loading={saving}>
          Save All
        </Button>
      </View>
    </SafeAreaView>
  );
}

interface BehaviorRowProps {
  student: StudentWithStatus;
  rating: BehaviorRating | null;
  notes: string;
  onRatingChange: (rating: BehaviorRating | null) => void;
  onNotesChange: (text: string) => void;
}

const BehaviorRow = memo(function BehaviorRow({
  student,
  rating,
  notes,
  onRatingChange,
  onNotesChange,
}: BehaviorRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const notesVisible = showNotes || !!notes;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-body-semibold text-[15px] text-charcoal flex-1" numberOfLines={1}>
          {student.full_name}
        </Text>
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

      {/* Rating buttons */}
      <View className="flex-row gap-2">
        {ratings.map(({ key, label }) => {
          const isActive = rating === key;
          return (
            <Pressable
              key={key}
              onPress={() => onRatingChange(isActive ? null : key)}
              className={`flex-1 h-12 items-center justify-center rounded-button border ${
                isActive ? '' : 'border-gray-200 bg-white'
              }`}
              style={isActive ? { backgroundColor: RATING_COLORS[key] } : undefined}
            >
              <Text
                className={`font-body-medium text-[12px] text-center ${
                  isActive ? '' : 'text-charcoal'
                }`}
                style={isActive ? { color: '#FFFFFF' } : undefined}
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
