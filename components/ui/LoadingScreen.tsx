import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/lib/colors';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-offwhite">
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
