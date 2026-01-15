# Push Notifications Setup - iOS & Android

## What Was Fixed

### iOS Configuration ✅
1. **app.json - iOS Settings**
   - Added `aps-environment: production` entitlement for push notifications
   - Enabled `UIBackgroundModes: remote-notification` for background notifications
   - Set `iosDisplayInForeground: true` to show notifications when app is open

2. **Permission Request**
   - Explicit iOS permission request with all required options:
     - `allowAlert: true` - Show notification banners
     - `allowBadge: true` - Show badge count on app icon
     - `allowSound: true` - Play notification sound

3. **Notification Handler**
   - `shouldShowAlert: true` - Display notification banner
   - `shouldPlaySound: true` - Play sound with notification
   - `shouldSetBadge: true` - Update app badge count

### Android Configuration ✅
1. **app.json - Android Settings**
   - Added `POST_NOTIFICATIONS` permission (required for Android 13+)
   - Enabled `useNextNotificationsApi: true` for better notification support
   - Configured notification channel with MAX importance

2. **Notification Channel**
   - Name: "Default Notifications"
   - Importance: MAX (appears on top with sound)
   - Vibration pattern: [0, 250, 250, 250]
   - Sound: default system sound
   - Badge: enabled
   - Lock screen visibility: PUBLIC

3. **Permissions**
   - `RECEIVE_BOOT_COMPLETED` - Receive notifications after device restart
   - `VIBRATE` - Vibrate on notification
   - `WAKE_LOCK` - Wake device for notifications
   - `POST_NOTIFICATIONS` - Required for Android 13+

## Testing Notifications

### Test Local Notification
```typescript
import { sendTestNotification } from '@/utils/testNotification';

// Call this to test if notifications work
await sendTestNotification();
```

### Test Push Notification (Backend)
Use the Convex action to send a real push notification:
```typescript
await ctx.runAction(api.pushNotifications.sendPushNotification, {
  userId: "user_clerk_id",
  title: "Test Push",
  body: "Testing push notifications!",
  data: { test: true },
});
```

## Building the App

After these changes, you MUST rebuild your app:

### For Development
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### For Production (EAS Build)
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Important Notes

1. **Physical Device Required**: Push notifications don't work on simulators/emulators
2. **Permissions**: Users must grant notification permissions
3. **Sound File**: Make sure `./assets/sound/notification.wav` exists
4. **Project ID**: Verify your EAS project ID is correct in app.json
5. **iOS Certificates**: For iOS production, you need proper APNs certificates configured in EAS

## Troubleshooting

### Notifications Not Showing
1. Check permissions: `await Notifications.getPermissionsAsync()`
2. Verify push token is saved: Check Convex database
3. Check console logs for errors
4. Ensure app is built with new configuration

### No Sound on iOS
1. Check device is not in silent mode
2. Verify notification settings in iOS Settings > App Name
3. Ensure `allowSound: true` in permission request

### No Sound on Android
1. Check notification channel settings
2. Verify app notification settings in Android Settings
3. Ensure channel importance is set to MAX

## Files Modified
- `app.json` - iOS/Android notification configuration
- `utils/pushNotifications.ts` - Permission request & notification handler
- `convex/pushNotifications.ts` - Backend push notification sending
- `utils/testNotification.ts` - Test utility (new file)
