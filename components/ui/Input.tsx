import { TextInput, View, Text } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export function Input({ label, placeholder, value, onChangeText }: InputProps) {
  return (
    <View>
      {label && <Text className="mb-1 font-body-medium text-[13px] text-gray-600">{label}</Text>}
      <TextInput
        className="h-12 rounded-button border border-gray-200 bg-white px-4 font-body text-[15px]"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
