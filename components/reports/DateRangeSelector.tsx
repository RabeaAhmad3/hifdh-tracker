import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import type { DateRangePreset } from '@/lib/types';
import { DATE_RANGE_LABELS } from '@/lib/constants';
import { colors } from '@/lib/colors';

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onValueChange: (preset: DateRangePreset) => void;
  customStart: Date;
  customEnd: Date;
  onCustomStartChange: (date: Date) => void;
  onCustomEndChange: (date: Date) => void;
}

const PRESETS: DateRangePreset[] = ['this_week', 'this_month', 'custom'];

export function DateRangeSelector({
  value,
  onValueChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: DateRangeSelectorProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View className="mb-4">
      {/* Segmented control */}
      <View className="flex-row rounded-button overflow-hidden border border-gray-200">
        {PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onValueChange(preset)}
            className={`flex-1 h-12 items-center justify-center ${
              value === preset ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`font-body-medium text-[14px] ${
                value === preset ? 'text-white' : 'text-charcoal'
              }`}
            >
              {DATE_RANGE_LABELS[preset]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Custom date pickers */}
      {value === 'custom' && (
        <View className="flex-row gap-3 mt-3">
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="flex-1 h-12 items-center justify-center rounded-button border border-gray-200"
          >
            <Text className="font-body text-[14px] text-charcoal">
              {format(customStart, 'MMM d, yyyy')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            className="flex-1 h-12 items-center justify-center rounded-button border border-gray-200"
          >
            <Text className="font-body text-[14px] text-charcoal">
              {format(customEnd, 'MMM d, yyyy')}
            </Text>
          </Pressable>

          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) onCustomStartChange(date);
              }}
              themeVariant="light"
              accentColor={colors.primary}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) onCustomEndChange(date);
              }}
              themeVariant="light"
              accentColor={colors.primary}
            />
          )}
        </View>
      )}
    </View>
  );
}
