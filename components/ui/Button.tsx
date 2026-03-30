import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantStyles = {
  primary: {
    container: 'bg-primary',
    text: 'text-white',
    indicator: '#FFFFFF',
  },
  secondary: {
    container: 'bg-primary-light',
    text: 'text-primary',
    indicator: '#3B8EAD',
  },
  ghost: {
    container: 'border border-gray-200',
    text: 'text-charcoal',
    indicator: '#2C2C2C',
  },
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 items-center justify-center rounded-button px-6 ${styles.container} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={styles.indicator} />
      ) : (
        <Text className={`font-body-semibold text-[15px] ${styles.text}`}>{title}</Text>
      )}
    </Pressable>
  );
}
