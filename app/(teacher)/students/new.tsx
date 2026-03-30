import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/colors';

export default function AddStudent() {
  const router = useRouter();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [currentJuz, setCurrentJuz] = useState('1');
  const [currentSurah, setCurrentSurah] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.show('Please enter the student\'s name', 'error');
      return;
    }

    setSaving(true);
    try {
      const juzNum = parseInt(currentJuz, 10);
      if (isNaN(juzNum) || juzNum < 1 || juzNum > 30) {
        toast.show('Juz must be between 1 and 30', 'error');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('students').insert({
        full_name: trimmedName,
        arabic_name: arabicName.trim() || null,
        date_of_birth: dateOfBirth.trim() || null,
        current_juz: juzNum,
        current_surah: currentSurah.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.show('Student added successfully', 'success');
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add student';
      toast.show(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="mr-3"
          >
            <ChevronLeft size={24} color={colors.charcoal} />
          </Pressable>
          <Text className="font-heading text-[20px] text-charcoal">
            Add Student
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            <Input
              label="Full Name *"
              placeholder="Enter student's full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label="Arabic Name"
              placeholder="Enter Arabic name (optional)"
              value={arabicName}
              onChangeText={setArabicName}
              autoCapitalize="none"
            />

            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD (optional)"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />

            <Input
              label="Current Juz"
              placeholder="1"
              value={currentJuz}
              onChangeText={setCurrentJuz}
              keyboardType="number-pad"
            />

            <Input
              label="Current Surah"
              placeholder="Enter current surah (optional)"
              value={currentSurah}
              onChangeText={setCurrentSurah}
              autoCapitalize="words"
            />

            <Input
              label="Notes"
              placeholder="Any additional notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />

            <Button onPress={handleSave} loading={saving} disabled={saving}>
              Save Student
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
