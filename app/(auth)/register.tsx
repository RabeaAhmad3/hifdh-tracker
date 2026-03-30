import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    inviteCode: z.string().length(8, 'Invite code must be 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    const { error } = await signUp(data.email, data.password, data.fullName, data.inviteCode);
    if (error) {
      setServerError(error);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-offwhite"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="font-heading text-[24px] text-charcoal">Create Account</Text>
          </View>

          {/* Form Card */}
          <View className="gap-4 rounded-card bg-white p-6 shadow-sm">
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  autoComplete="name"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />

            <View>
              <Controller
                control={control}
                name="inviteCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Invite Code"
                    placeholder="8-character code"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.inviteCode?.message}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                )}
              />
              <Text className="mt-1 font-body text-[13px] text-gray-400">
                Enter the 8-character code from your child's teacher
              </Text>
            </View>

            {serverError ? (
              <Text className="font-body text-[13px] text-error">{serverError}</Text>
            ) : null}

            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Create Account
            </Button>
          </View>

          {/* Login Link */}
          <View className="mt-6 items-center">
            <Link href="/(auth)/login">
              <Text className="font-body text-[15px] text-primary">
                Already have an account? Sign in
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
