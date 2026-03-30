import { useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useConversation } from '@/hooks/useMessages';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/components/ui/Toast';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { colors } from '@/lib/colors';
import { formatLabel } from '@/lib/constants';
import type { ConversationWithDetails } from '@/lib/types';

interface ConversationThreadProps {
  conversationId: string;
  otherParticipant?: ConversationWithDetails['other_participant'];
}

export function ConversationThread({ conversationId, otherParticipant }: ConversationThreadProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const toast = useToast();
  const { messages, loading, sending, error, send, loadMore } = useConversation(
    conversationId,
    profile?.id,
  );

  useEffect(() => {
    if (error) {
      toast.show(error, 'error');
    }
  }, [error]);

  if (loading && messages.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-offwhite"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View
        className="flex-row items-center border-b border-gray-100 bg-white px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={() => router.back()} className="mr-3 h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>
        {otherParticipant && (
          <>
            <Avatar
              name={otherParticipant.full_name}
              size="sm"
              imageUrl={otherParticipant.avatar_url}
            />
            <View className="ml-3">
              <Text className="font-body-semibold text-[16px] text-charcoal">
                {otherParticipant.full_name}
              </Text>
              <Text className="font-body text-[12px] text-gray-400">
                {formatLabel(otherParticipant.role)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isSent={item.sender_id === profile?.id}
          />
        )}
        inverted
        contentContainerStyle={{ paddingVertical: 12 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
      />

      {/* Input */}
      <MessageInput onSend={send} sending={sending} />
    </KeyboardAvoidingView>
  );
}
