import { Switch, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { NOTIFICATION_PREFERENCE_OPTIONS } from '@/lib/constants';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Card } from '@/components/ui/Card';
import type { UserRole } from '@/lib/types';

interface NotificationPreferencesProps {
  userId: string;
  role: UserRole;
}

export function NotificationPreferences({ userId, role }: NotificationPreferencesProps) {
  const { preferences, loading, togglePreference } = useNotificationPreferences(userId);

  const options = NOTIFICATION_PREFERENCE_OPTIONS.filter((opt) => opt.roles.includes(role));

  if (loading || !preferences) return null;

  return (
    <View className="px-4">
      <View className="mb-3 flex-row items-center">
        <Bell size={18} color={colors.charcoal} />
        <Text className="ml-2 font-heading text-[18px] text-charcoal">Notifications</Text>
      </View>

      <Card>
        {options.map((opt, index) => (
          <View
            key={opt.key}
            className={`min-h-[48px] flex-row items-center justify-between ${index > 0 ? 'mt-3 border-t border-gray-100 pt-3' : ''}`}
          >
            <View className="mr-4 flex-1">
              <Text className="font-body-semibold text-[15px] text-charcoal">{opt.label}</Text>
              <Text className="mt-0.5 font-body text-[13px] text-gray-400">{opt.description}</Text>
            </View>
            <Switch
              value={preferences[opt.key]}
              onValueChange={(value) => togglePreference(opt.key, value)}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}
