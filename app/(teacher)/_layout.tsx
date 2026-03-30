import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  MessageSquare,
  Settings,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { TabIcon } from '@/components/ui/TabIcon';

export default function TeacherLayout() {
  const insets = useSafeAreaInsets();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray400,
      tabBarLabelStyle: {
        fontFamily: 'SourceSans3_400Regular',
        fontSize: 11,
      },
      tabBarStyle: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
        height: 64 + insets.bottom,
        paddingBottom: insets.bottom,
      },
    }),
    [insets.bottom],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Users} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ClipboardCheck} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={MessageSquare} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{ href: null }}
      />
    </Tabs>
  );
}
