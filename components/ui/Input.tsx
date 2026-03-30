import { TextInput, View, Text, type TextInputProps } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View>
      {label && <Text className="mb-1 font-body-medium text-[13px] text-gray-600">{label}</Text>}
      <TextInput
        className={`h-12 rounded-button border bg-white px-4 font-body text-[15px] ${
          error ? 'border-error' : 'border-gray-200'
        }`}
        placeholderTextColor="#A0A0A0"
        {...props}
      />
      {error && <Text className="mt-1 font-body text-[13px] text-error">{error}</Text>}
    </View>
  );
}
