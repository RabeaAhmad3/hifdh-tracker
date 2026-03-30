import { View, Text, FlatList, Pressable } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { colors } from '@/lib/colors';
import { formatLabel } from '@/lib/constants';
import type { ConversationWithDetails } from '@/lib/types';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  loading: boolean;
  onRefresh: () => void;
  onPress: (conversation: ConversationWithDetails) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  loading,
  onRefresh,
  onPress,
  onNewConversation,
}: ConversationListProps) {
  if (loading && conversations.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3"
          >
            <Avatar
              name={item.other_participant.full_name}
              size="md"
              imageUrl={item.other_participant.avatar_url}
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <Text className="font-body-semibold text-[15px] text-charcoal" numberOfLines={1}>
                    {item.other_participant.full_name}
                  </Text>
                  <Text className="ml-2 font-body text-[11px] text-gray-400">
                    {formatLabel(item.other_participant.role)}
                  </Text>
                </View>
                {item.last_message && (
                  <Text className="ml-2 font-body text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(item.last_message.created_at), { addSuffix: true })}
                  </Text>
                )}
              </View>
              <View className="mt-0.5 flex-row items-center">
                <Text
                  className={`flex-1 font-body text-[13px] ${
                    item.unread_count > 0 ? 'text-charcoal' : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {item.last_message?.content ?? 'No messages yet'}
                </Text>
                {item.unread_count > 0 && (
                  <View className="ml-2 h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </View>
            </View>
          </Pressable>
        )}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <EmptyState
              icon={MessageSquare}
              title="No Conversations"
              description="Start a new conversation to message staff or parents."
              actionLabel="New Message"
              onAction={onNewConversation}
            />
          </View>
        }
      />

      {/* FAB */}
      <View className="absolute bottom-6 right-6">
        <Pressable
          onPress={onNewConversation}
          className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md"
          style={{ elevation: 4 }}
        >
          <Plus size={24} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
