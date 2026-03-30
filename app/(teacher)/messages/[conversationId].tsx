import { useLocalSearchParams } from 'expo-router';
import { ConversationThread } from '@/components/chat/ConversationThread';
import type { UserRole } from '@/lib/types';

export default function TeacherConversation() {
  const { conversationId, name, role, avatarUrl, participantId } = useLocalSearchParams<{
    conversationId: string;
    name?: string;
    role?: string;
    avatarUrl?: string;
    participantId?: string;
  }>();

  const otherParticipant = name
    ? {
        id: participantId ?? '',
        full_name: name,
        role: (role ?? 'parent') as UserRole,
        avatar_url: avatarUrl || null,
      }
    : undefined;

  return (
    <ConversationThread
      conversationId={conversationId}
      otherParticipant={otherParticipant}
    />
  );
}
