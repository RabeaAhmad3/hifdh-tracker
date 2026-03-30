import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/lib/colors';
import { ATTENDANCE_STATUS_COLORS } from '@/lib/constants';
import type { AttendanceStatus } from '@/lib/types';

interface AttendanceDotProps {
  status: AttendanceStatus | null;
  size?: 'sm' | 'md';
  onPress?: () => void;
}

const sizeMap = { sm: 12, md: 20 } as const;

export const AttendanceDot = memo(function AttendanceDot({
  status,
  size = 'md',
  onPress,
}: AttendanceDotProps) {
  const dimension = sizeMap[size];
  const bg = status ? ATTENDANCE_STATUS_COLORS[status] : colors.gray200;

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
