import { View, Text } from 'react-native';

interface StatusChipProps {
  label: string;
}

export function StatusChip({ label }: StatusChipProps) {
  return (
    <View className="rounded-chip px-3 py-1">
      <Text className="font-body-medium text-[13px]">{label}</Text>
    </View>
  );
}
