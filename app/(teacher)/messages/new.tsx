import { useCallback, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/colors';
import { formatLabel } from '@/lib/constants';
import {
  createOrGetConversation,
  fetchParentContacts,
  fetchStaffDirectory,
} from '@/hooks/useMessages';
import type { StaffMember } from '@/lib/types';

interface ParentContact {
  id: string;
  full_name: string;
  avatar_url: string | null;
  student_names: string[];
}

type SectionData =
  | { type: 'parent'; item: ParentContact }
  | { type: 'staff'; item: StaffMember };

export default function TeacherNewMessage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { show: showToast } = useToast();
  const [parents, setParents] = useState<ParentContact[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [parentResult, staffResult] = await Promise.all([
        fetchParentContacts(),
        fetchStaffDirectory(),
      ]);
      setParents(parentResult.data);
      // Filter out self from staff
      setStaff(staffResult.data.filter((s) => s.id !== profile?.id));
      if (parentResult.error) showToast(parentResult.error, 'error');
      if (staffResult.error) showToast(staffResult.error, 'error');
      setLoading(false);
    })();
  }, [profile?.id, showToast]);

  const handleMessage = useCallback(
    async (contactId: string, contactName: string, contactRole: string, contactAvatar: string | null) => {
      setCreating(contactId);
      const result = await createOrGetConversation(contactId);
      if (result.error || !result.conversationId) {
        showToast(result.error ?? 'Failed to start conversation', 'error');
        setCreating(null);
        return;
      }
      router.replace({
        pathname: '/(teacher)/messages/[conversationId]',
        params: {
          conversationId: result.conversationId,
          name: contactName,
          role: contactRole,
          avatarUrl: contactAvatar ?? '',
          participantId: contactId,
        },
      });
    },
    [router, showToast],
  );

  if (loading) return <LoadingScreen />;

  const sections: { title: string; data: SectionData[] }[] = [];

  if (parents.length > 0) {
    sections.push({
      title: 'Parents',
      data: parents.map((p) => ({ type: 'parent' as const, item: p })),
    });
  }
  if (staff.length > 0) {
    sections.push({
      title: 'Staff',
      data: staff.map((s) => ({ type: 'staff' as const, item: s })),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3 h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>
        <Text className="font-heading text-[20px] text-charcoal">New Message</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-offwhite px-4 pb-1 pt-4">
            <Text className="font-body-semibold text-[13px] uppercase text-gray-600">{title}</Text>
          </View>
        )}
        renderItem={({ item: sectionItem }) => {
          if (sectionItem.type === 'parent') {
            const parent = sectionItem.item;
            return (
              <View className="mx-4 mb-2 flex-row items-center rounded-card bg-white p-4 shadow-sm">
                <Avatar name={parent.full_name} size="md" imageUrl={parent.avatar_url} />
                <View className="ml-3 flex-1">
                  <Text className="font-body-semibold text-[15px] text-charcoal">
                    {parent.full_name}
                  </Text>
                  {parent.student_names.length > 0 && (
                    <Text className="mt-0.5 font-body text-[12px] text-gray-600">
                      Parent of {parent.student_names.join(', ')}
                    </Text>
                  )}
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  loading={creating === parent.id}
                  disabled={creating !== null}
                  onPress={() => handleMessage(parent.id, parent.full_name, 'parent', parent.avatar_url)}
                >
                  Message
                </Button>
              </View>
            );
          }

          const member = sectionItem.item;
          return (
            <View className="mx-4 mb-2 flex-row items-center rounded-card bg-white p-4 shadow-sm">
              <Avatar name={member.full_name} size="md" imageUrl={member.avatar_url} />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="font-body-semibold text-[15px] text-charcoal">
                    {member.full_name}
                  </Text>
                  <Text className="ml-2 font-body text-[11px] text-gray-400">
                    {formatLabel(member.role)}
                  </Text>
                </View>
              </View>
              <Button
                variant="primary"
                size="sm"
                loading={creating === member.id}
                disabled={creating !== null}
                onPress={() => handleMessage(member.id, member.full_name, member.role, member.avatar_url)}
              >
                Message
              </Button>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="pt-20">
            <EmptyState
              icon={Users}
              title="No Contacts"
              description="No parents or staff members found."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
