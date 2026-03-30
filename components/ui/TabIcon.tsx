import { type ComponentType } from 'react';
import { View } from 'react-native';

interface TabIconProps {
  icon: ComponentType<{ size: number; color: string }>;
  color: string;
  focused: boolean;
}

export function TabIcon({ icon: Icon, color, focused }: TabIconProps) {
  return (
    <View className="items-center">
      <Icon size={24} color={color} />
      {focused && <View className="mt-1 h-1 w-1 rounded-full bg-primary" />}
    </View>
  );
}
