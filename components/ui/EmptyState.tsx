import { type ComponentType } from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/lib/colors';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6">
      <Icon size={48} color={colors.gray400} />
      <Text className="mt-4 font-body-semibold text-[18px] text-charcoal">{title}</Text>
      <Text className="mt-2 text-center font-body text-[15px] text-gray-600">{description}</Text>
      {actionLabel && onAction && (
        <View className="mt-6">
          <Button variant="primary" size="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}
