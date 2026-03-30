import { View, Text } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View
      className="items-center justify-center rounded-full bg-primary-light"
      style={{ width: size, height: size }}
    >
      <Text className="font-body-semibold text-[14px] text-primary">{initials}</Text>
    </View>
  );
}
