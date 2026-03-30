import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProfileFormProps {
  profile: Profile;
  email: string;
  onSaved: () => void;
}

export function ProfileForm({ profile, email, onSaved }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const isDirty =
    fullName.trim() !== profile.full_name ||
    (phone.trim() || null) !== (profile.phone ?? null);

  const handleSave = useCallback(async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
        phone: phone.trim() || null,
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      setNameError('Failed to save. Please try again.');
      return;
    }

    onSaved();
  }, [fullName, phone, profile.id, onSaved]);

  return (
    <Card className="mx-4 mt-2 mb-2">
      <View className="gap-3">
        <Input
          label="Full Name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (nameError) setNameError('');
          }}
          error={nameError}
          autoCapitalize="words"
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Optional"
        />
        <Input
          label="Email"
          value={email}
          editable={false}
          style={{ opacity: 0.5 }}
        />
        <Button
          onPress={handleSave}
          disabled={!isDirty || saving}
          loading={saving}
        >
          Save
        </Button>
      </View>
    </Card>
  );
}
