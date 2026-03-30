import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/lib/colors';
import { RATING_COLORS } from '@/lib/constants';
import type { BehaviorRating } from '@/lib/types';

interface BehaviorDotProps {
  rating: BehaviorRating | null;
  size?: 'sm' | 'md';
  onPress?: () => void;
}

const sizeMap = { sm: 12, md: 20 } as const;

export const BehaviorDot = memo(function BehaviorDot({
  rating,
  size = 'md',
  onPress,
}: BehaviorDotProps) {
  const dimension = sizeMap[size];
  const bg = rating ? RATING_COLORS[rating] : colors.gray200;

  const dotStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: bg,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={4} style={dotStyle} />
    );
  }

  return <View style={dotStyle} />;
});
