import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/colors';
import { DAY_LABELS_FULL, formatLabel } from '@/lib/constants';
import { createOrGetConversation, fetchStaffDirectory } from '@/hooks/useMessages';
import type { StaffMember } from '@/lib/types';

export default function ParentNewMessage() {
  const router = useRouter();
  const { show: showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await fetchStaffDirectory();
      setStaff(result.data);
      if (result.error) showToast(result.error, 'error');
      setLoading(false);
    })();
  }, [showToast]);

  const handleMessage = useCallback(
    async (staffId: string) => {
      setCreating(staffId);
      const result = await createOrGetConversation(staffId);
      if (result.error || !result.conversationId) {
        showToast(result.error ?? 'Failed to start conversation', 'error');
        setCreating(null);
        return;
      }
      const member = staff.find((s) => s.id === staffId);
      router.replace({
        pathname: '/(parent)/messages/[conversationId]',
        params: {
          conversationId: result.conversationId,
          name: member?.full_name ?? '',
          role: member?.role ?? 'teacher',
          avatarUrl: member?.avatar_url ?? '',
          participantId: staffId,
        },
      });
    },
    [router, showToast, staff],
  );

  const formatAvailability = (member: StaffMember) => {
    if (member.availability.length === 0) return null;
    const days = member.availability.map((a) => DAY_LABELS_FULL[a.day_of_week]).filter(Boolean);
    const uniqueDays = [...new Set(days)];
    return uniqueDays.join(', ');
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-offwhite">
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3 h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color={colors.charcoal} />
        </Pressable>
        <Text className="font-heading text-[20px] text-charcoal">Contact Staff</Text>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const availability = formatAvailability(item);
          return (
            <View className="mx-4 mb-2 flex-row items-center rounded-card bg-white p-4 shadow-sm">
              <Avatar name={item.full_name} size="md" imageUrl={item.avatar_url} />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="font-body-semibold text-[15px] text-charcoal">
                    {item.full_name}
                  </Text>
                  <Text className="ml-2 font-body text-[11px] text-gray-400">
                    {formatLabel(item.role)}
                  </Text>
                </View>
                {availability && (
                  <Text className="mt-0.5 font-body text-[12px] text-gray-600">
                    Available: {availability}
                  </Text>
                )}
              </View>
              <Button
                variant="primary"
                size="sm"
                loading={creating === item.id}
                disabled={creating !== null}
                onPress={() => handleMessage(item.id)}
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
              title="No Staff Found"
              description="No teachers or staff are currently available."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
