import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/colors';

export function CardHeaderOrnament() {
  return (
    <View className="overflow-hidden rounded-t-card">
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3, width: '100%' }}
      />
    </View>
  );
}
