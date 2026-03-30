import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Calendar, Clock, User } from 'lucide-react-native';
import { format, parse } from 'date-fns';
import { colors } from '@/lib/colors';
import { formatTime } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { openAddToCalendar } from '@/lib/calendar';
import type { MeetingBookingWithDetails, UserRole } from '@/lib/types';

interface UpcomingMeetingCardProps {
  meeting: MeetingBookingWithDetails;
  role: UserRole;
  onCancel: (id: string) => Promise<{ error: string | null }>;
  cancelling?: boolean;
}

export function UpcomingMeetingCard({ meeting, role, onCancel, cancelling }: UpcomingMeetingCardProps) {
  const [localCancelling, setLocalCancelling] = useState(false);
  const isCancelling = cancelling || localCancelling;

  const participantName = role === 'teacher' ? meeting.parent_name : meeting.teacher_name;
  const dateDisplay = format(parse(meeting.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d');

  const handleCancel = () => {
    Alert.alert(
      'Cancel Meeting',
      'Are you sure you want to cancel this meeting?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLocalCancelling(true);
            await onCancel(meeting.id);
            setLocalCancelling(false);
          },
        },
      ],
    );
  };

  const handleAddToCalendar = () => {
    openAddToCalendar({
      title: `Meeting with ${participantName} - ${meeting.student_name}`,
      date: meeting.date,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
      description: meeting.notes ?? undefined,
    });
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-center">
        <User size={16} color={colors.primary} />
        <Text className="ml-2 font-body-semibold text-[15px] text-charcoal">
          {participantName}
        </Text>
      </View>

      <Text className="mt-1 font-body text-[13px] text-gray-600">
        Student: {meeting.student_name}
      </Text>

      <View className="mt-2 flex-row items-center">
        <Calendar size={14} color={colors.gray600} />
        <Text className="ml-1.5 font-body text-[13px] text-charcoal">{dateDisplay}</Text>
        <Clock size={14} color={colors.gray600} className="ml-3" />
        <Text className="ml-1.5 font-body text-[13px] text-charcoal">
          {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
        </Text>
      </View>

      {meeting.notes ? (
        <Text className="mt-2 font-body text-[12px] text-gray-600">{meeting.notes}</Text>
      ) : null}

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1">
          <Button variant="secondary" size="sm" onPress={handleAddToCalendar}>
            Add to Calendar
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="ghost" size="sm" onPress={handleCancel} loading={isCancelling}>
            Cancel
          </Button>
        </View>
      </View>
    </Card>
  );
}
