/**
 * Notification utility functions
 */

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_created':
      return 'calendar';
    case 'booking_cancelled':
      return 'calendar-outline';
    case 'booking_reminder':
      return 'alarm';
    case 'trainer_added':
      return 'person-add';
    case 'payment_request':
      return 'card';
    case 'goal_updated':
      return 'analytics';
    default:
      return 'notifications';
  }
};

export const getNotificationColor = (type: string, colors: any) => {
  switch (type) {
    case 'booking_created':
      return colors.success;
    case 'booking_cancelled':
      return colors.error;
    case 'booking_reminder':
      return colors.warning;
    case 'trainer_added':
      return colors.primary;
    case 'payment_request':
      return colors.info;
    case 'goal_updated':
      return colors.primary;
    default:
      return colors.primary;
  }
};

export const formatNotificationTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

export const getNotificationTitle = (type: string, data?: any) => {
  switch (type) {
    case 'booking_created':
      return 'New Booking';
    case 'booking_cancelled':
      return 'Booking Cancelled';
    case 'booking_reminder':
      return 'Session Reminder';
    case 'trainer_added':
      return 'New Trainer Added';
    case 'payment_request':
      return 'Payment Request';
    case 'goal_updated':
      return 'Progress Updated';
    default:
      return 'Notification';
  }
};