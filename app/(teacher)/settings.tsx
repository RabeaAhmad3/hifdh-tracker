import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Plus } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { DAY_LABELS_FULL } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { AvailabilitySlotCard } from '@/components/meetings/AvailabilitySlotCard';
import { AvailabilitySlotForm } from '@/components/meetings/AvailabilitySlotForm';
import { UpcomingMeetingCard } from '@/components/meetings/UpcomingMeetingCard';
import {
  useTeacherAvailability,
  useUpcomingMeetings,
} from '@/hooks/useMeetingScheduling';
import type { TeacherAvailability } from '@/lib/types';

export default function TeacherSettings() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const { slots, loading: slotsLoading, addSlot, toggleSlot, deleteSlot } = useTeacherAvailability(profile?.id);
  const { meetings, loading: meetingsLoading, cancel } = useUpcomingMeetings(profile?.id, 'teacher');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddSlot = useCallback(
    async (params: { day_of_week: number; start_time: string; end_time: string }) => {
      setSubmitting(true);
      const result = await addSlot(params);
      setSubmitting(false);
      return result;
    },
    [addSlot],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Slot', 'Are you sure you want to delete this availability slot?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSlot(id) },
      ]);
    },
    [deleteSlot],
  );

  // Group slots by day
  const groupedSlots = useMemo(
    () =>
      slots.reduce<Record<number, TeacherAvailability[]>>((acc, slot) => {
        (acc[slot.day_of_week] ??= []).push(slot);
        return acc;
      }, {}),
    [slots],
  );

  if (!profile) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Section */}
        <View className="items-center px-4 pb-4 pt-6">
          <Avatar name={profile.full_name} size="lg" imageUrl={profile.avatar_url} />
          <Text className="mt-3 font-heading text-[20px] text-charcoal">{profile.full_name}</Text>
          <Text className="mt-1 font-body text-[13px] text-gray-400">Teacher</Text>
        </View>

        <ProfileForm
          profile={profile}
          email={session?.user?.email ?? ''}
          onSaved={async () => {
            await refreshProfile();
            toast.show('Profile updated', 'success');
          }}
        />

        <View className="mx-4">
          <Button variant="ghost" onPress={signOut}>
            <View className="flex-row items-center">
              <LogOut size={16} color={colors.charcoal} />
              <Text className="ml-2 font-body-semibold text-[15px] text-charcoal">Sign Out</Text>
            </View>
          </Button>
        </View>

        <SectionDivider />

        <NotificationPreferences userId={profile.id} role="teacher" />

        <SectionDivider />

        {/* Meeting Availability Section */}
        <View className="px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-heading text-[18px] text-charcoal">Meeting Availability</Text>
            <Pressable
              onPress={() => setShowForm(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            >
              <Plus size={20} color={colors.white} />
            </Pressable>
          </View>

          {slotsLoading ? (
            <Text className="py-4 text-center font-body text-[13px] text-gray-400">Loading...</Text>
          ) : slots.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No Availability"
              description="Add your available times so parents can schedule meetings."
            />
          ) : (
            Object.entries(groupedSlots)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, daySlots]) => (
                <View key={day} className="mb-3">
                  <Text className="mb-1 font-body-semibold text-[13px] text-gray-400">
                    {DAY_LABELS_FULL[Number(day)]}
                  </Text>
                  {daySlots.map((slot) => (
                    <AvailabilitySlotCard
                      key={slot.id}
                      slot={slot}
                      onToggle={toggleSlot}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              ))
          )}
        </View>

        <SectionDivider />

        {/* Upcoming Meetings Section */}
        <View className="px-4">
          <Text className="mb-3 font-heading text-[18px] text-charcoal">Upcoming Meetings</Text>

          {meetingsLoading ? (
            <Text className="py-4 text-center font-body text-[13px] text-gray-400">Loading...</Text>
          ) : meetings.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No Upcoming Meetings"
              description="Meetings booked by parents will appear here."
            />
          ) : (
            meetings.map((meeting) => (
              <UpcomingMeetingCard
                key={meeting.id}
                meeting={meeting}
                role="teacher"
                onCancel={cancel}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AvailabilitySlotForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddSlot}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}
