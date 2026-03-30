import { View, Text } from 'react-native';
import { Image } from 'expo-image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  imageUrl?: string | null;
}

const sizeMap: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56 };
const fontSizeMap: Record<AvatarSize, number> = { sm: 12, md: 14, lg: 20 };

export function Avatar({ name, size = 'md', imageUrl }: AvatarProps) {
  const px = sizeMap[size];
  const fontSize = fontSizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={imageUrl}
        contentFit="cover"
        style={{ width: px, height: px, borderRadius: px / 2 }}
      />
    );
  }

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
      style={{ width: px, height: px }}
    >
      <Text className="font-body-semibold text-primary" style={{ fontSize }}>
        {initials}
      </Text>
    </View>
  );
}
