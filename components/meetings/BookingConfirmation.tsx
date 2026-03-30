import { Text, TextInput, View } from 'react-native';
import { Calendar, CheckCircle, Clock, User } from 'lucide-react-native';
import { format, parse } from 'date-fns';
import { colors } from '@/lib/colors';
import { formatTime } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BookingConfirmationProps {
  teacherName: string;
  studentName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmed: boolean;
  onAddToCalendar: () => void;
  onDone: () => void;
}

export function BookingConfirmation({
  teacherName,
  studentName,
  date,
  startTime,
  endTime,
  notes,
  onNotesChange,
  onConfirm,
  confirming,
  confirmed,
  onAddToCalendar,
  onDone,
}: BookingConfirmationProps) {
  const dateDisplay = format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d, yyyy');

  if (confirmed) {
    return (
      <View className="items-center px-4 py-8">
        <CheckCircle size={48} color={colors.success} />
        <Text className="mt-4 font-heading text-[20px] text-charcoal">Meeting Booked!</Text>
        <Text className="mt-2 text-center font-body text-[14px] text-gray-600">
          Your meeting with {teacherName} has been confirmed.
        </Text>

        <View className="mt-6 w-full gap-3">
          <Button variant="secondary" onPress={onAddToCalendar}>
            Add to Calendar
          </Button>
          <Button onPress={onDone}>Done</Button>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text className="mb-3 font-heading text-[18px] text-charcoal">Confirm Booking</Text>

      <Card className="mb-4">
        <View className="flex-row items-center">
          <User size={16} color={colors.primary} />
          <Text className="ml-2 font-body-semibold text-[15px] text-charcoal">
            {teacherName}
          </Text>
        </View>

        <Text className="mt-1 font-body text-[13px] text-gray-600">
          Student: {studentName}
        </Text>

        <View className="mt-2 flex-row items-center">
          <Calendar size={14} color={colors.gray600} />
          <Text className="ml-1.5 font-body text-[13px] text-charcoal">{dateDisplay}</Text>
        </View>

        <View className="mt-1 flex-row items-center">
          <Clock size={14} color={colors.gray600} />
          <Text className="ml-1.5 font-body text-[13px] text-charcoal">
            {formatTime(startTime)} – {formatTime(endTime)}
          </Text>
        </View>
      </Card>

      <Text className="mb-2 font-body-medium text-[14px] text-charcoal">Notes (optional)</Text>
      <TextInput
        className="rounded-button border border-gray-200 p-3 font-body text-[14px] text-charcoal"
        placeholder="Add a note for the teacher..."
        placeholderTextColor={colors.gray400}
        value={notes}
        onChangeText={onNotesChange}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{ minHeight: 80 }}
      />

      <View className="mt-4">
        <Button onPress={onConfirm} loading={confirming}>
          Confirm Booking
        </Button>
      </View>
    </View>
  );
}
