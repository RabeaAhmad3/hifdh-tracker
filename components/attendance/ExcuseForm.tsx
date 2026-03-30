import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { toDateString } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { DateNavigator } from '@/components/ui/DateNavigator';

interface ExcuseFormProps {
  visible: boolean;
  initialDate?: Date;
  onClose: () => void;
  onSubmit: (date: string, reason: string) => Promise<{ error: string | null }>;
  submitting: boolean;
}

export function ExcuseForm({ visible, initialDate, onClose, onSubmit, submitting }: ExcuseFormProps) {
  const [date, setDate] = useState(initialDate ?? new Date());

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setDate(initialDate ?? new Date());
      setReason('');
      setError(null);
    }
  }, [visible, initialDate]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a reason for the absence.');
      return;
    }

    setError(null);
    const result = await onSubmit(toDateString(date), trimmed);
    if (result.error) {
      setError(result.error);
    } else {
      setReason('');
      setDate(new Date());
      onClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    setDate(new Date());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
          <Text className="font-heading text-[20px] text-charcoal">
            Submit Excuse
          </Text>
          <Pressable
            onPress={handleClose}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <X size={24} color={colors.charcoal} />
          </Pressable>
        </View>

        <View className="px-4 pt-4">
          <Text className="font-body-medium text-[14px] text-charcoal mb-2">
            Date
          </Text>
          <DateNavigator date={date} onChange={setDate} />

          <Text className="font-body-medium text-[14px] text-charcoal mt-4 mb-2">
            Reason
          </Text>
          <TextInput
            className="border border-gray-200 rounded-button p-3 font-body text-[14px] text-charcoal"
            placeholder="Why was your child absent?"
            placeholderTextColor={colors.gray400}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />

          {error && (
            <View className="rounded-button bg-error/10 p-3 mt-3">
              <Text className="font-body text-[13px] text-error">{error}</Text>
            </View>
          )}

          <View className="mt-4">
            <Button onPress={handleSubmit} loading={submitting}>
              Submit Excuse
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
