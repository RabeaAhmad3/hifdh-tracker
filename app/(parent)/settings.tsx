import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, LogOut } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { UpcomingMeetingCard } from '@/components/meetings/UpcomingMeetingCard';
import { useUpcomingMeetings } from '@/hooks/useMeetingScheduling';

export default function ParentSettings() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const { meetings, loading, cancel } = useUpcomingMeetings(profile?.id, 'parent');

  if (!profile) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Section */}
        <View className="items-center px-4 pb-4 pt-6">
          <Avatar name={profile.full_name} size="lg" imageUrl={profile.avatar_url} />
          <Text className="mt-3 font-heading text-[20px] text-charcoal">{profile.full_name}</Text>
          <Text className="mt-1 font-body text-[13px] text-gray-400">Parent</Text>
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

        <NotificationPreferences userId={profile.id} role="parent" />

        <SectionDivider />

        {/* My Meetings Section */}
        <View className="px-4">
          <Text className="mb-3 font-heading text-[18px] text-charcoal">My Meetings</Text>

          {loading ? (
            <Text className="py-4 text-center font-body text-[13px] text-gray-400">Loading...</Text>
          ) : meetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No Upcoming Meetings"
              description="Schedule a meeting with a teacher from the Messages tab."
            />
          ) : (
            meetings.map((meeting) => (
              <UpcomingMeetingCard
                key={meeting.id}
                meeting={meeting}
                role="parent"
                onCancel={cancel}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
