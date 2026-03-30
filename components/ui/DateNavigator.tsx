import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, addDays, subDays } from 'date-fns';
import { colors } from '@/lib/colors';
import { Button } from '@/components/ui/Button';

interface DateNavigatorProps {
  date: Date;
  onChange: (date: Date) => void;
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected != null) {
      onChange(selected);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    }
  };

  const dateDisplay = format(date, 'EEE, MMM d, yyyy');

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onChange(subDays(date, 1))}
          className="h-12 w-12 items-center justify-center"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>

        <Pressable onPress={() => setShowPicker(true)}>
          <Text className="font-body-semibold text-[16px] text-charcoal">
            {dateDisplay}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange(addDays(date, 1))}
          className="h-12 w-12 items-center justify-center"
          hitSlop={8}
        >
          <ChevronRight size={24} color={colors.primary} />
        </Pressable>
      </View>

      {showPicker && (
        <View className="mt-2">
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setShowPicker(false)}
            >
              Done
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
