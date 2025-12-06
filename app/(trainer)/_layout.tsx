import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';
import { useTrainerProfileCheck } from '@/hooks/useTrainerProfileCheck';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme === 'dark');
  
  // Check if trainer profile is complete
  useTrainerProfileCheck();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />  <Tabs.Screen
        name="set-goal"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          href : null
        }}
      />
       <Tabs.Screen
        name="add-client"
        options={{
          href : null ,
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />  
       <Tabs.Screen
        name="client-detail"
        options={{
          href : null ,
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="edit-goal"
        options={{
          href : null ,
          title: 'Edit Goal',
          tabBarIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-progress"
        options={{
          href : null ,
          title: 'Add Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="add" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress-tracking"
        options={{
          href : null ,
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-payment-request"
        options={{
          href : null ,
          title: 'Payment Request',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
    </Tabs>
    
  );
}
