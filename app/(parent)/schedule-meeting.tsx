import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { useParentStudentContext } from '@/lib/ParentStudentContext';
import { openAddToCalendar } from '@/lib/calendar';
import { useToast } from '@/components/ui/Toast';
import { DateSelector } from '@/components/meetings/DateSelector';
import { TimeSlotGrid } from '@/components/meetings/TimeSlotGrid';
import { BookingConfirmation } from '@/components/meetings/BookingConfirmation';
import {
  bookMeeting,
  useAvailableSlots,
  type TimeSlot,
} from '@/hooks/useMeetingScheduling';

type Step = 'date' | 'time' | 'confirm';

const STEPS: Step[] = ['date', 'time', 'confirm'] as const;
const STEP_LABELS: Record<Step, string> = { date: 'Date', time: 'Time', confirm: 'Confirm' };

export default function ScheduleMeeting() {
  const router = useRouter();
  const { show: showToast } = useToast();
  const { profile } = useAuth();
  const { students, selectedStudent } = useParentStudentContext();
  const { teacherId, teacherName } = useLocalSearchParams<{ teacherId: string; teacherName: string }>();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(selectedStudent?.id ?? '');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { slots, loading: slotsLoading } = useAvailableSlots(teacherId, selectedDate);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedSlot(null);
    } else if (step === 'confirm') {
      setStep('time');
    } else {
      router.back();
    }
  };

  const handleConfirm = async () => {
    if (!profile?.id || !teacherId || !selectedDate || !selectedSlot) return;

    const studentId = selectedStudentId || selectedStudent?.id;
    if (!studentId) {
      showToast('Please select a student.', 'error');
      return;
    }

    setConfirming(true);
    const result = await bookMeeting({
      teacher_id: teacherId,
      parent_id: profile.id,
      student_id: studentId,
      date: selectedDate,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      notes: notes.trim() || undefined,
    });

    if (result.error) {
      showToast(result.error, 'error');
    } else {
      setConfirmed(true);
    }
    setConfirming(false);
  };

  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedSlot) return;
    openAddToCalendar({
      title: `Meeting with ${teacherName ?? 'Teacher'}`,
      date: selectedDate,
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      description: notes.trim() || undefined,
    });
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId) ?? selectedStudent;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={handleBack} className="mr-3 h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-heading text-[18px] text-charcoal">
            Schedule Meeting
          </Text>
          {teacherName ? (
            <Text className="font-body text-[13px] text-gray-600">with {teacherName}</Text>
          ) : null}
        </View>
      </View>

      {/* Step indicator */}
      <View className="flex-row border-b border-gray-100 bg-white px-4 py-2">
        {STEPS.map((s, i) => (
          <View key={s} className="flex-1 flex-row items-center">
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                step === s ? 'bg-primary' : i < STEPS.indexOf(step) ? 'bg-primary/30' : 'bg-gray-200'
              }`}
            >
              <Text className={`font-body-semibold text-[12px] ${step === s ? 'text-white' : 'text-gray-600'}`}>
                {i + 1}
              </Text>
            </View>
            <Text className={`ml-1 font-body text-[12px] ${step === s ? 'text-primary' : 'text-gray-400'}`}>
              {STEP_LABELS[s]}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Child selector (if multiple children) */}
        {students.length > 1 && step !== 'confirm' && (
          <View className="mb-4">
            <Text className="mb-2 font-body-medium text-[14px] text-charcoal">Select Child</Text>
            <View className="flex-row flex-wrap gap-2">
              {students.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedStudentId(s.id)}
                  className={`rounded-button px-4 py-2 ${
                    selectedStudentId === s.id ? 'bg-primary' : 'border border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`font-body-semibold text-[13px] ${
                      selectedStudentId === s.id ? 'text-white' : 'text-charcoal'
                    }`}
                  >
                    {s.full_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 'date' && teacherId && (
          <DateSelector
            teacherId={teacherId}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
          />
        )}

        {step === 'time' && (
          <View>
            <Text className="mb-3 font-heading text-[16px] text-charcoal">Select a Time</Text>
            <TimeSlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
              loading={slotsLoading}
            />
          </View>
        )}

        {step === 'confirm' && selectedDate && selectedSlot && (
          <BookingConfirmation
            teacherName={teacherName ?? 'Teacher'}
            studentName={currentStudent?.full_name ?? 'Student'}
            date={selectedDate}
            startTime={selectedSlot.start_time}
            endTime={selectedSlot.end_time}
            notes={notes}
            onNotesChange={setNotes}
            onConfirm={handleConfirm}
            confirming={confirming}
            confirmed={confirmed}
            onAddToCalendar={handleAddToCalendar}
            onDone={() => router.back()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
