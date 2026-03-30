import { useCallback, useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { useConversations } from '@/hooks/useMessages';
import { useUpcomingMeetings } from '@/hooks/useMeetingScheduling';
import { ConversationList } from '@/components/chat/ConversationList';
import { UpcomingMeetingCard } from '@/components/meetings/UpcomingMeetingCard';
import type { ConversationWithDetails } from '@/lib/types';

export default function ParentMessages() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const { conversations, loading, error, refresh } = useConversations(profile?.id);
  const { meetings, cancel } = useUpcomingMeetings(profile?.id, 'parent');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (error) {
      toast.show(error, 'error');
    }
  }, [error]);

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
      {/* Upcoming Meetings */}
      {meetings.length > 0 && (
        <View className="border-b border-gray-100 pb-2">
          <Text className="px-4 pb-2 pt-4 font-body-semibold text-[14px] text-gray-600">
            Upcoming Meetings
          </Text>
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View style={{ width: 280 }}>
                <UpcomingMeetingCard
                  meeting={item}
                  role="parent"
                  onCancel={cancel}
                />
              </View>
            )}
          />
        </View>
      )}

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
