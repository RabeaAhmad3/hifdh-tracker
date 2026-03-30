import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';
import { format, parse, isBefore, addMinutes } from 'date-fns';
import { colors } from '@/lib/colors';
import { DAY_LABELS_FULL } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

interface AvailabilitySlotFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: { day_of_week: number; start_time: string; end_time: string }) => Promise<{ error: string | null }>;
  submitting: boolean;
}

const DAY_CHIPS = DAY_LABELS_FULL.map((label, i) => ({ label: label.slice(0, 3), value: i }));

export function AvailabilitySlotForm({ visible, onClose, onSubmit, submitting }: AvailabilitySlotFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [startTime, setStartTime] = useState(parse('15:00', 'HH:mm', new Date()));
  const [endTime, setEndTime] = useState(parse('17:00', 'HH:mm', new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDayOfWeek(1);
      setStartTime(parse('15:00', 'HH:mm', new Date()));
      setEndTime(parse('17:00', 'HH:mm', new Date()));
      setError(null);
    }
  }, [visible]);

  const handleStartChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selected) setStartTime(selected);
  };

  const handleEndChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selected) setEndTime(selected);
  };

  const handleSubmit = async () => {
    // Validate: end must be > start + 30 min
    const minEnd = addMinutes(startTime, 30);
    if (isBefore(endTime, minEnd)) {
      setError('End time must be at least 30 minutes after start time.');
      return;
    }

    setError(null);
    const result = await onSubmit({
      day_of_week: dayOfWeek,
      start_time: format(startTime, 'HH:mm:ss'),
      end_time: format(endTime, 'HH:mm:ss'),
    });

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 pb-3 pt-2">
          <Text className="font-heading text-[20px] text-charcoal">Add Availability</Text>
          <Pressable onPress={onClose} className="h-12 w-12 items-center justify-center" hitSlop={8}>
            <X size={24} color={colors.charcoal} />
          </Pressable>
        </View>

        <View className="px-4 pt-4">
          {/* Day of Week Picker */}
          <Text className="mb-2 font-body-medium text-[14px] text-charcoal">Day of Week</Text>
          <View className="flex-row gap-1">
            {DAY_CHIPS.map((chip) => (
              <Pressable
                key={chip.value}
                onPress={() => setDayOfWeek(chip.value)}
                className={`h-10 flex-1 items-center justify-center rounded-button ${
                  dayOfWeek === chip.value ? 'bg-primary' : 'border border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={`font-body-semibold text-[13px] ${
                    dayOfWeek === chip.value ? 'text-white' : 'text-charcoal'
                  }`}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Start Time */}
          <Text className="mb-2 mt-4 font-body-medium text-[14px] text-charcoal">Start Time</Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="h-12 justify-center rounded-button border border-gray-200 bg-white px-3"
          >
            <Text className="font-body text-[15px] text-charcoal">{format(startTime, 'h:mm a')}</Text>
          </Pressable>
          {showStartPicker && (
            <View className="mt-2">
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartChange}
                minuteInterval={15}
              />
              {Platform.OS === 'ios' && (
                <Button variant="ghost" size="sm" onPress={() => setShowStartPicker(false)}>
                  Done
                </Button>
              )}
            </View>
          )}

          {/* End Time */}
          <Text className="mb-2 mt-4 font-body-medium text-[14px] text-charcoal">End Time</Text>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            className="h-12 justify-center rounded-button border border-gray-200 bg-white px-3"
          >
            <Text className="font-body text-[15px] text-charcoal">{format(endTime, 'h:mm a')}</Text>
          </Pressable>
          {showEndPicker && (
            <View className="mt-2">
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndChange}
                minuteInterval={15}
              />
              {Platform.OS === 'ios' && (
                <Button variant="ghost" size="sm" onPress={() => setShowEndPicker(false)}>
                  Done
                </Button>
              )}
            </View>
          )}

          {error && (
            <View className="mt-3 rounded-button bg-error/10 p-3">
              <Text className="font-body text-[13px] text-error">{error}</Text>
            </View>
          )}

          <View className="mt-4">
            <Button onPress={handleSubmit} loading={submitting}>
              Add Slot
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
