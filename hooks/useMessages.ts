import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MESSAGE_COLUMNS, TEACHER_AVAILABILITY_COLUMNS } from '@/lib/constants';
import type {
  ConversationWithDetails,
  MessageWithSender,
  StaffMember,
  TeacherAvailability,
  UserRole,
} from '@/lib/types';

// ============================================================
// Standalone functions
// ============================================================

export async function fetchConversations(
  userId: string,
): Promise<{ data: ConversationWithDetails[]; error: string | null }> {
  try {
    // 1. Get all conversation IDs for this user
    const { data: participants, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .eq('user_id', userId);

    if (pError) throw new Error(pError.message);
    if (!participants || participants.length === 0) return { data: [], error: null };

    const conversationIds = participants.map((p) => p.conversation_id);

    // 2. Fetch other participants, conversations, and recent messages in parallel
    const [otherParticipantsResult, conversationsResult, recentMessagesResult] = await Promise.all([
      supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles:user_id(id, full_name, avatar_url, role)')
        .in('conversation_id', conversationIds)
        .neq('user_id', userId),
      supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false }),
      supabase
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(Math.min(conversationIds.length * 30, 500)),
    ]);

    if (otherParticipantsResult.error) throw new Error(otherParticipantsResult.error.message);
    if (conversationsResult.error) throw new Error(conversationsResult.error.message);
    if (recentMessagesResult.error) throw new Error(recentMessagesResult.error.message);

    // Build lookup maps
    const otherParticipantMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; role: UserRole }>();
    for (const op of otherParticipantsResult.data ?? []) {
      const profile = op.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; role: UserRole };
      if (profile) {
        otherParticipantMap.set(op.conversation_id, profile);
      }
    }

    // Group messages by conversation
    const messagesByConv = new Map<string, typeof recentMessagesResult.data>();
    for (const msg of recentMessagesResult.data ?? []) {
      const existing = messagesByConv.get(msg.conversation_id) ?? [];
      existing.push(msg);
      messagesByConv.set(msg.conversation_id, existing);
    }

    const result: ConversationWithDetails[] = [];
    for (const conv of conversationsResult.data ?? []) {
      const other = otherParticipantMap.get(conv.id);
      if (!other) continue;

      const msgs = messagesByConv.get(conv.id) ?? [];
      const lastMsg = msgs[0] ?? null;
      const unreadCount = msgs.filter((m) => !m.is_read && m.sender_id !== userId).length;

      result.push({
        id: conv.id,
        updated_at: conv.updated_at,
        other_participant: other,
        last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, sender_id: lastMsg.sender_id } : null,
        unread_count: unreadCount,
      });
    }

    return { data: result, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch conversations' };
  }
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
  pageSize = 30,
): Promise<{ messages: MessageWithSender[]; nextCursor: string | null; error: string | null }> {
  try {
    let query = supabase
      .from('messages')
      .select(`${MESSAGE_COLUMNS}, profiles:sender_id(full_name, avatar_url)`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const messages: MessageWithSender[] = (data ?? []).map((m) => {
      const profile = m.profiles as unknown as { full_name: string; avatar_url: string | null } | null;
      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
        sender_name: profile?.full_name ?? 'Unknown',
        sender_avatar_url: profile?.avatar_url ?? null,
      };
    });

    const nextCursor = messages.length === pageSize ? messages[messages.length - 1].created_at : null;

    return { messages, nextCursor, error: null };
  } catch (err) {
    return { messages: [], nextCursor: null, error: err instanceof Error ? err.message : 'Failed to fetch messages' };
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const { error: insertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, content, sender_id: userId });

    if (insertError) throw new Error(insertError.message);

    // Update conversation.updated_at
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) throw new Error(updateError.message);

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send message' };
  }
}

export async function markAsRead(
  conversationId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to mark as read' };
  }
}

export async function createOrGetConversation(
  otherUserId: string,
): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('create_or_get_conversation', {
      p_other_user_id: otherUserId,
    });

    if (error) throw new Error(error.message);
    return { conversationId: data as string, error: null };
  } catch (err) {
    return { conversationId: null, error: err instanceof Error ? err.message : 'Failed to create conversation' };
  }
}

export async function fetchStaffDirectory(): Promise<{
  data: StaffMember[];
  error: string | null;
}> {
  try {
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .in('role', ['teacher', 'admin'])
      .order('full_name');

    if (pError) throw new Error(pError.message);

    const teacherIds = (profiles ?? []).filter((p) => p.role === 'teacher').map((p) => p.id);

    const availabilityMap = new Map<string, TeacherAvailability[]>();
    if (teacherIds.length > 0) {
      const { data: availability, error: aError } = await supabase
        .from('teacher_availability')
        .select(TEACHER_AVAILABILITY_COLUMNS)
        .in('teacher_id', teacherIds)
        .eq('is_active', true)
        .order('day_of_week');

      if (aError) throw new Error(aError.message);

      for (const slot of availability ?? []) {
        const existing = availabilityMap.get(slot.teacher_id) ?? [];
        existing.push(slot as TeacherAvailability);
        availabilityMap.set(slot.teacher_id, existing);
      }
    }

    const staff: StaffMember[] = (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role as UserRole,
      avatar_url: p.avatar_url,
      availability: availabilityMap.get(p.id) ?? [],
    }));

    return { data: staff, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch staff' };
  }
}

export async function fetchParentContacts(): Promise<{
  data: { id: string; full_name: string; avatar_url: string | null; student_names: string[] }[];
  error: string | null;
}> {
  try {
    // Get all parents
    const { data: parents, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'parent')
      .order('full_name');

    if (pError) throw new Error(pError.message);
    if (!parents || parents.length === 0) return { data: [], error: null };

    // Get parent-student links with student names
    const parentIds = parents.map((p) => p.id);
    const { data: links, error: lError } = await supabase
      .from('parent_students')
      .select('parent_id, students:student_id(full_name)')
      .in('parent_id', parentIds);

    if (lError) throw new Error(lError.message);

    const studentNameMap = new Map<string, string[]>();
    for (const link of links ?? []) {
      const student = link.students as unknown as { full_name: string } | null;
      if (student) {
        const names = studentNameMap.get(link.parent_id) ?? [];
        names.push(student.full_name);
        studentNameMap.set(link.parent_id, names);
      }
    }

    const result = parents.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      student_names: studentNameMap.get(p.id) ?? [],
    }));

    return { data: result, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch parents' };
  }
}

// ============================================================
// Hooks
// ============================================================

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationsRef = useRef<ConversationWithDetails[]>([]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const result = await fetchConversations(userId);
    setConversations(result.data);
    conversationsRef.current = result.data;
    setError(result.error);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAll();

    // Subscribe to new messages — check if relevant before refetching
    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchAll();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchAll]);

  return { conversations, loading, error, refresh: fetchAll };
}

export function useConversation(conversationId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  // Cache sender profiles to avoid N+1 queries on realtime messages
  const profileCacheRef = useRef<Map<string, { full_name: string; avatar_url: string | null }>>(new Map());

  // Initial fetch + mark as read
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      const result = await fetchMessages(conversationId);
      setMessages(result.messages);
      cursorRef.current = result.nextCursor;
      setHasMore(result.nextCursor !== null);
      setError(result.error);
      setLoading(false);

      // Cache profiles from initial fetch
      for (const msg of result.messages) {
        profileCacheRef.current.set(msg.sender_id, {
          full_name: msg.sender_name,
          avatar_url: msg.sender_avatar_url,
        });
      }

      // Mark messages as read
      await markAsRead(conversationId, userId);
    })();
  }, [conversationId, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; conversation_id: string; sender_id: string; content: string; is_read: boolean; created_at: string };

          // Use cached profile, fetch only on cache miss
          let senderProfile = profileCacheRef.current.get(newMsg.sender_id);
          if (!senderProfile) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();
            senderProfile = { full_name: profile?.full_name ?? 'Unknown', avatar_url: profile?.avatar_url ?? null };
            profileCacheRef.current.set(newMsg.sender_id, senderProfile);
          }

          const messageWithSender: MessageWithSender = {
            ...newMsg,
            sender_name: senderProfile.full_name,
            sender_avatar_url: senderProfile.avatar_url,
          };

          setMessages((prev) => {
            // Remove optimistic message if present (match by sender + content)
            const withoutOptimistic = prev.filter(
              (m) => !(m.id.startsWith('optimistic-') && m.sender_id === newMsg.sender_id && m.content === newMsg.content),
            );
            // Avoid duplicates by real ID
            if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic;
            return [messageWithSender, ...withoutOptimistic];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== userId) {
            await markAsRead(conversationId, userId);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const result = await fetchMessages(conversationId, cursorRef.current ?? undefined);
    if (result.messages.length > 0) {
      setMessages((prev) => [...prev, ...result.messages]);
      cursorRef.current = result.nextCursor;
      setHasMore(result.nextCursor !== null);
    } else {
      setHasMore(false);
    }
    loadingMoreRef.current = false;
  }, [conversationId, hasMore]);

  const send = useCallback(async (content: string) => {
    if (!userId) return;
    setSending(true);

    // Optimistic: add the message immediately
    const optimisticMsg: MessageWithSender = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: '',
      sender_avatar_url: null,
    };
    setMessages((prev) => [optimisticMsg, ...prev]);

    const result = await sendMessage(conversationId, content, userId);
    if (result.error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setError(result.error);
    }
    setSending(false);
  }, [conversationId, userId]);

  return { messages, loading, sending, error, loadMore, send, hasMore };
}
