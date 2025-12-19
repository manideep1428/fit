import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';
import { AnimatedCard } from './AnimatedCard';
import { AnimatedButton } from './AnimatedButton';
import { getNotificationIcon, getNotificationColor, formatNotificationTime } from '@/utils/notifications';

interface NotificationHistoryProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationHistory({ visible, onClose }: NotificationHistoryProps) {
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const [showMenu, setShowMenu] = useState(false);

  // Fetch notifications
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteAllNotifications = useMutation(api.notifications.deleteAllNotifications);

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      try {
        await markAsRead({ notificationId: notification._id });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await markAllAsRead({ userId: user.id });
      setShowMenu(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications({ userId: user.id });
              setShowMenu(false);
            } catch (error) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 py-4"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingTop: 60,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Notifications
            </Text>
          </View>

          {/* Three dots menu */}
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showMenu && (
              <View
                className="absolute top-12 right-0 rounded-xl p-2 z-10"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...shadows.large,
                  minWidth: 160,
                }}
              >
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  className="flex-row items-center px-3 py-3 rounded-lg"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <Ionicons name="checkmark-done" size={18} color={colors.text} />
                  <Text className="ml-3 font-medium" style={{ color: colors.text }}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteAll}
                  className="flex-row items-center px-3 py-3 rounded-lg"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <Ionicons name="trash" size={18} color={colors.error} />
                  <Text className="ml-3 font-medium" style={{ color: colors.error }}>
                    Delete all
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {!notifications ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="notifications-outline" size={40} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
                No notifications yet
              </Text>
              <Text className="text-center" style={{ color: colors.textSecondary }}>
                You'll see your notifications here when you receive them
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {notifications.map((notification: any, index: number) => {
                // Safety check for notification data
                if (!notification || !notification._id) {
                  return null;
                }
                
                return (
                  <AnimatedCard
                    key={notification._id}
                    delay={index * 50}
                    onPress={() => handleNotificationPress(notification)}
                    style={{
                      opacity: notification.read ? 0.7 : 1,
                    }}
                    elevation="small"
                    borderRadius="large"
                  >
                  <View className="flex-row items-start">
                    {/* Icon */}
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{
                        backgroundColor: `${getNotificationColor(notification.type, colors)}15`,
                      }}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={getNotificationColor(notification.type, colors)}
                      />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          className="font-bold text-base flex-1"
                          style={{ color: colors.text }}
                          numberOfLines={2}
                        >
                          {notification.title || 'Notification'}
                        </Text>
                        {!notification.read && (
                          <View
                            className="w-2 h-2 rounded-full ml-2 mt-2"
                            style={{ backgroundColor: colors.primary }}
                          />
                        )}
                      </View>

                      <Text
                        className="text-sm mb-2"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={3}
                      >
                        {notification.message || 'No message'}
                      </Text>

                      <Text
                        className="text-xs"
                        style={{ color: colors.textTertiary }}
                      >
                        {formatNotificationTime(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                  </AnimatedCard>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Close overlay when menu is open */}
        {showMenu && (
          <TouchableOpacity
            className="absolute inset-0"
            onPress={() => setShowMenu(false)}
            style={{ backgroundColor: 'transparent' }}
          />
        )}
      </View>
    </Modal>
  );
}