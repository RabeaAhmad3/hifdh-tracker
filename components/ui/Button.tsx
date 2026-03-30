import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
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
  accent: {
    container: 'bg-coral',
    text: 'text-white',
    indicator: '#FFFFFF',
  },
};

const sizeStyles = {
  sm: 'h-10 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

const sizeText = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[17px]',
};

export function Button({
  children,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center rounded-button ${sizeStyles[size]} ${styles.container} ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={styles.indicator} />
      ) : typeof children === 'string' ? (
        <Text className={`font-body-semibold ${sizeText[size]} ${styles.text}`}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
