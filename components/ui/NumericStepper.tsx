import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function NumericStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
}: NumericStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  const decrement = () => {
    if (!atMin) {
      onChange(Math.max(min, value - step));
    }
  };

  const increment = () => {
    if (!atMax) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <View className="flex-row items-center">
      {label != null && (
        <Text className="font-body text-[14px] text-gray-600 mr-3">{label}</Text>
      )}
      <Pressable
        onPress={decrement}
        disabled={atMin}
        className={`h-8 w-8 items-center justify-center rounded-full bg-gray-100 ${
          atMin ? 'opacity-50' : ''
        }`}
        hitSlop={8}
      >
        <Minus size={16} color={colors.charcoal} />
      </Pressable>
      <Text className="font-body-semibold text-[18px] w-8 text-center text-charcoal">
        {value}
      </Text>
      <Pressable
        onPress={increment}
        disabled={atMax}
        className={`h-8 w-8 items-center justify-center rounded-full bg-primary-light ${
          atMax ? 'opacity-50' : ''
        }`}
        hitSlop={8}
      >
        <Plus size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}
