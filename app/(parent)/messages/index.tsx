import { SafeAreaView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useConversations } from '@/hooks/useMessages';
import { ConversationList } from '@/components/chat/ConversationList';
import type { ConversationWithDetails } from '@/lib/types';

export default function ParentMessages() {
  const router = useRouter();
  const { profile } = useAuth();
  const { conversations, loading, refresh } = useConversations(profile?.id);

  const handlePress = (conversation: ConversationWithDetails) => {
    router.push({
      pathname: '/(parent)/messages/[conversationId]',
      params: {
        conversationId: conversation.id,
        name: conversation.other_participant.full_name,
        role: conversation.other_participant.role,
        avatarUrl: conversation.other_participant.avatar_url ?? '',
        participantId: conversation.other_participant.id,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      <View className="px-4 pb-2 pt-4">
        <Text className="font-heading text-[24px] text-charcoal">Messages</Text>
      </View>
      <ConversationList
        conversations={conversations}
        loading={loading}
        onRefresh={refresh}
        onPress={handlePress}
        onNewConversation={() => router.push('/(parent)/messages/new')}
      />
    </SafeAreaView>
  );
}
