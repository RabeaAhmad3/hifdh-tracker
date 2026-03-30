import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Send } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface MessageInputProps {
  onSend: (content: string) => void;
  sending?: boolean;
}

export function MessageInput({ onSend, sending = false }: MessageInputProps) {
  const [text, setText] = useState('');

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !sending;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="flex-row items-end border-t border-gray-100 bg-white px-4 py-2">
      <TextInput
        className="max-h-[100px] flex-1 rounded-full bg-gray-100 px-4 py-2.5 font-body text-[15px] text-charcoal"
        placeholder="Type a message..."
        placeholderTextColor={colors.gray400}
        value={text}
        onChangeText={setText}
        multiline
        editable={!sending}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={`ml-2 h-12 w-12 items-center justify-center rounded-full ${
          canSend ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <Send size={20} color={canSend ? colors.white : colors.gray400} />
      </Pressable>
    </View>
  );
}
