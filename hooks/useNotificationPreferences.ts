import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NOTIFICATION_PREFERENCES_COLUMNS } from '@/lib/constants';
import type { NotificationPreferences, NotificationType } from '@/lib/types';

const ALL_ENABLED: Omit<NotificationPreferences, 'user_id'> = {
  new_assignment: true,
  new_message: true,
  meeting_booked: true,
  absence: true,
};

export function useNotificationPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select(NOTIFICATION_PREFERENCES_COLUMNS)
        .eq('user_id', userId)
        .maybeSingle();

      if (ignore) return;

      if (error) {
        console.error('Failed to fetch notification preferences:', error.message);
      }

      setPreferences(data ?? { user_id: userId, ...ALL_ENABLED });
      setLoading(false);
    })();

    return () => { ignore = true; };
  }, [userId]);

  const togglePreference = useCallback(
    async (key: NotificationType, value: boolean) => {
      if (!userId) return;
      const current = preferencesRef.current;
      if (!current) return;

      const updated = { ...current, [key]: value };
      setPreferences(updated);
      preferencesRef.current = updated;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { ...updated, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );

      if (error) {
        console.error('Failed to update notification preference:', error.message);
        setPreferences(current);
        preferencesRef.current = current;
      }
    },
    [userId],
  );

  return { preferences, loading, togglePreference };
}
