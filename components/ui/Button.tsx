import { Pressable, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
}

export function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} className="h-12 items-center justify-center rounded-button bg-primary px-6">
      <Text className="font-body-semibold text-[15px] text-white">{title}</Text>
    </Pressable>
  );
}
