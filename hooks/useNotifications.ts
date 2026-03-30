import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId as
  | string
  | undefined;

/** Cached token from last successful registration */
let cachedPushToken: string | null = null;

/**
 * Register device for push notifications and upsert token to Supabase.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  if (!Device.isDevice || !PROJECT_ID) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });

  cachedPushToken = tokenData;

  // Upsert token (table has UNIQUE on user_id, token)
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token: tokenData, platform: Platform.OS },
    { onConflict: 'user_id,token' }
  );
  // Clean up stale tokens from other devices
  await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .neq('token', tokenData);

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B8EAD',
    });
  }

  return tokenData;
}

/**
 * Get the current Expo push token (for cleanup on sign-out).
 * Returns cached token if available, avoiding extra native bridge call.
 */
export async function getCurrentPushToken(): Promise<string | null> {
  if (cachedPushToken) return cachedPushToken;
  try {
    if (!PROJECT_ID || !Device.isDevice) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    return data;
  } catch {
    return null;
  }
}

/** Clear cached token (called after sign-out cleanup) */
export function clearCachedPushToken(): void {
  cachedPushToken = null;
}

/** Deep link route map by role */
const ROUTE_MAP: Record<string, Record<UserRole, string>> = {
  assignments: {
    parent: '/(parent)/assignments',
    teacher: '/(teacher)/dashboard',
    admin: '/(teacher)/dashboard',
  },
  messages: {
    parent: '/(parent)/messages',
    teacher: '/(teacher)/messages',
    admin: '/(teacher)/messages',
  },
  attendance: {
    parent: '/(parent)/attendance',
    teacher: '/(teacher)/attendance',
    admin: '/(teacher)/attendance',
  },
  meetings: {
    parent: '/(parent)/schedule-meeting',
    teacher: '/(teacher)/settings',
    admin: '/(teacher)/settings',
  },
};

/**
 * Hook that registers for push notifications and handles deep linking on tap.
 */
export function useNotifications(
  userId: string | undefined,
  role: UserRole | undefined
) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (!userId) return;

    registerForPushNotifications(userId);

    // Tap handler — deep link into the app
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, string>
          | undefined;

        const currentRole = roleRef.current;
        if (!data?.screen || !currentRole) return;

        const routes = ROUTE_MAP[data.screen];
        if (!routes) return;

        const route = routes[currentRole];

        // For messages with a conversationId, navigate directly to the conversation
        if (data.screen === 'messages' && data.conversationId) {
          const prefix = currentRole === 'parent' ? '/(parent)' : '/(teacher)';
          routerRef.current.push(
            `${prefix}/messages/${data.conversationId}` as any
          );
          return;
        }

        routerRef.current.push(route as any);
      });

    return () => {
      subscription.remove();
    };
  }, [userId]);
}
