import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/colors';

export function SectionDivider() {
  return (
    <View className="my-4 flex-row items-center">
      <View className="h-px flex-1 bg-gray-200" />
      <View className="mx-3">
        <Svg width={14} height={14} viewBox="0 0 100 100">
          <Path
            d="M50 0 L57.5 30 L85.4 14.6 L70 42.5 L100 50 L70 57.5 L85.4 85.4 L57.5 70 L50 100 L42.5 70 L14.6 85.4 L30 57.5 L0 50 L30 42.5 L14.6 14.6 L42.5 30 Z"
            fill={colors.primary}
          />
        </Svg>
      </View>
      <View className="h-px flex-1 bg-gray-200" />
    </View>
  );
}
