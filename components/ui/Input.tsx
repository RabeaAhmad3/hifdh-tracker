import { useState } from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { colors } from '@/lib/colors';

interface BaseInputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
}

interface UncontrolledInputProps extends BaseInputProps {
  control?: undefined;
  name?: undefined;
}

interface ControlledInputProps<T extends FieldValues> extends BaseInputProps {
  control: Control<T>;
  name: Path<T>;
}

type InputProps<T extends FieldValues = FieldValues> =
  | UncontrolledInputProps
  | ControlledInputProps<T>;

function InputField({ label, error, onFocus, onBlur, ...props }: BaseInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? 'border-error'
    : isFocused
      ? 'border-primary'
      : 'border-gray-200';

  return (
    <View>
      {label && <Text className="mb-1 font-body-medium text-[13px] text-gray-600">{label}</Text>}
      <TextInput
        className={`h-12 rounded-button border bg-white px-4 font-body text-[15px] ${borderClass}`}
        placeholderTextColor={colors.gray400}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text className="mt-1 font-body text-[13px] text-error">{error}</Text>}
    </View>
  );
}

export function Input<T extends FieldValues = FieldValues>(props: InputProps<T>) {
  if (props.control && props.name) {
    const { control, name, error: externalError, ...rest } = props;
    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <InputField
            value={value}
            onChangeText={onChange}
            onBlur={(e) => {
              onBlur();
              rest.onBlur?.(e);
            }}
            error={externalError ?? fieldError?.message}
            {...rest}
          />
        )}
      />
    );
  }

  const { control: _control, name: _name, ...rest } = props;
  return <InputField {...rest} />;
}
