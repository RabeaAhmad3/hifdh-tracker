import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useStudents, type StudentWithStatus } from '@/hooks/useStudents';
import { useBulkBehavior } from '@/hooks/useBulkBehavior';
import { useBulkAttendance } from '@/hooks/useBulkAttendance';
import { toDateString, RATING_COLORS } from '@/lib/constants';
import { colors } from '@/lib/colors';
import type { BehaviorRating } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateNavigator } from '@/components/ui/DateNavigator';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/components/ui/Toast';
import { AttendanceRow } from '@/components/attendance/AttendanceRow';
import { ExcusePanel } from '@/components/attendance/ExcusePanel';

type Segment = 'attendance' | 'behavior';

const ratings: { key: BehaviorRating; label: string }[] = [
  { key: 'very_good', label: 'Very Good' },
  { key: 'good', label: 'Good' },
  { key: 'needs_improvement', label: 'Needs Imp.' },
];

const ItemSeparator = () => <View className="h-2" />;

export default function TeacherAttendance() {
  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <AttendanceContent />
    </SafeAreaView>
  );
}

function AttendanceContent() {
  const { profile } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const [date, setDate] = useState(new Date());
  const [segment, setSegment] = useState<Segment>('attendance');
  const dateStr = toDateString(date);
  const teacherId = profile?.id ?? '';

  if (studentsLoading) return <LoadingScreen />;

  return (
    <>
      {/* Header */}
      <View className="px-4 pt-2 pb-1">
        <Text className="font-heading text-[24px] text-charcoal">
          Attendance
        </Text>
      </View>

      {/* Segment toggle */}
      <View className="flex-row mx-4 mt-2 mb-1 bg-gray-100 rounded-button p-1">
        <Pressable
          onPress={() => setSegment('attendance')}
          className="flex-1 h-10 items-center justify-center rounded-button"
          style={segment === 'attendance' ? styles.activeTab : undefined}
        >
          <Text
            className={`font-body-medium text-[14px] ${
              segment === 'attendance' ? 'text-primary' : 'text-gray-400'
            }`}
          >
            Attendance
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSegment('behavior')}
          className="flex-1 h-10 items-center justify-center rounded-button"
          style={segment === 'behavior' ? styles.activeTab : undefined}
        >
          <Text
            className={`font-body-medium text-[14px] ${
              segment === 'behavior' ? 'text-primary' : 'text-gray-400'
            }`}
          >
            Behavior
          </Text>
        </Pressable>
      </View>

      <SectionDivider />

      <View className="px-4 pt-2">
        <DateNavigator date={date} onChange={setDate} />
      </View>

      {segment === 'attendance' ? (
        <AttendanceSegment students={students} dateStr={dateStr} teacherId={teacherId} />
      ) : (
        <BehaviorSegment students={students} dateStr={dateStr} teacherId={teacherId} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

// ---- Segment Components (hooks only fire when mounted) ----

interface SegmentProps {
  students: StudentWithStatus[];
  dateStr: string;
  teacherId: string;
}

function AttendanceSegment({ students, dateStr, teacherId }: SegmentProps) {
  const toast = useToast();
  const {
    entries,
    excuses,
    setEntry,
    setNotes,
    markAllPresent,
    saving,
    loading,
    saveAll,
  } = useBulkAttendance(dateStr, teacherId);

  const handleSave = useCallback(async () => {
    const { error } = await saveAll();
    toast.show(error ?? 'Attendance saved', error ? 'error' : 'success');
  }, [saveAll, toast]);

  const handleMarkAllPresent = useCallback(() => {
    if (students.length > 0) {
      markAllPresent(students.map((s) => s.id));
    }
  }, [students, markAllPresent]);

  const excuseList = useMemo(() => Array.from(excuses.values()), [excuses]);

  const renderItem = useCallback(
    ({ item }: { item: StudentWithStatus }) => (
      <AttendanceRow
        student={item}
        status={entries.get(item.id)?.status ?? null}
        notes={entries.get(item.id)?.notes ?? ''}
        hasExcuse={excuses.has(item.id)}
        onStatusChange={(status) => setEntry(item.id, status)}
        onNotesChange={(text) => setNotes(item.id, text)}
      />
    ),
    [entries, excuses, setEntry, setNotes],
  );

  if (loading) return <LoadingScreen />;

  return (
    <>
      <View className="px-4 mt-2">
        <Button variant="secondary" onPress={handleMarkAllPresent}>
          Mark All Present
        </Button>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-24 pt-2"
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={
          <ExcusePanel excuses={excuseList} students={students} />
        }
      />

      <View className="absolute bottom-0 left-0 right-0 bg-offwhite px-4 pb-6 pt-3 border-t border-gray-100">
        <Button onPress={handleSave} loading={saving}>
          Save Attendance
        </Button>
      </View>
    </>
  );
}

function BehaviorSegment({ students, dateStr, teacherId }: SegmentProps) {
  const toast = useToast();
  const {
    entries,
    setEntry,
    setNotes,
    saving,
    loading,
    saveAll,
  } = useBulkBehavior(dateStr, teacherId);

  const handleSave = useCallback(async () => {
    const { error } = await saveAll();
    toast.show(error ?? 'Behavior saved', error ? 'error' : 'success');
  }, [saveAll, toast]);

  const renderItem = useCallback(
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

  if (loading) return <LoadingScreen />;

  return (
    <>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-24 pt-2"
        ItemSeparatorComponent={ItemSeparator}
      />

      <View className="absolute bottom-0 left-0 right-0 bg-offwhite px-4 pb-6 pt-3 border-t border-gray-100">
        <Button onPress={handleSave} loading={saving}>
          Save Behavior
        </Button>
      </View>
    </>
  );
}

// ---- BehaviorRow (preserved from Section 7) ----

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
