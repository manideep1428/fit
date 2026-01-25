# Google Calendar Integration Setup Guide

## Issue
Google Sign-In opens but doesn't complete the authentication and calendar connection.

## Root Causes
1. Missing or incorrect OAuth scopes configuration
2. Server auth code not being properly requested
3. Token refresh configuration missing
4. Insufficient error handling

## Fixes Applied

### 1. Updated `app/google.tsx`
- Added `forceCodeForRefreshToken: true` to ensure refresh token is obtained
- Added both calendar scopes: `calendar` and `calendar.events`
- Improved error handling with detailed messages
- Added sign-out before sign-in to force fresh consent
- Better logging for debugging

### 2. Key Changes
```typescript
// Before
scopes: ["https://www.googleapis.com/auth/calendar"],

// After
scopes: [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
],
forceCodeForRefreshToken: true,
```

## Additional Setup Required

### Android Configuration

1. **Verify SHA-1 Certificate Fingerprint**
   ```bash
   cd android
   ./gradlew signingReport
   ```
   Copy the SHA-1 from the debug keystore and add it to your Google Cloud Console.

2. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Navigate to "APIs & Services" > "Credentials"
   - Ensure you have:
     - Android OAuth 2.0 Client ID with correct package name and SHA-1
     - Web OAuth 2.0 Client ID (for server auth code)
   - Enable "Google Calendar API" in "APIs & Services" > "Library"

3. **Verify Client IDs**
   Current configuration uses:
   - iOS Client ID: `1083333912631-gdfm0chhuaedqpth2hqlun6270g5srrq.apps.googleusercontent.com`
   - Web Client ID: `1083333912631-2une8flb8bm7j1b90pg71muc98mu5t8v.apps.googleusercontent.com`
   
   Make sure these match your Google Cloud Console credentials.

### iOS Configuration

1. **Add URL Scheme**
   In `ios/[YourApp]/Info.plist`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.1083333912631-gdfm0chhuaedqpth2hqlun6270g5srrq</string>
       </array>
     </dict>
   </array>
   ```

## Testing Steps

1. **Clear Previous Sessions**
   ```bash
   # Clear app data on device
   adb shell pm clear com.manideep1428.fit
   ```

2. **Test Sign-In Flow**
   - Open the app
   - Navigate to Google Calendar settings
   - Click "Connect Google Calendar"
   - Should see Google account picker
   - Select account
   - Grant calendar permissions
   - Should see success message

3. **Verify Token Storage**
   - Check Convex dashboard for user record
   - Verify `googleAccessToken` and `googleRefreshToken` are stored

## Debugging

If issues persist, check logs:

```bash
# Android
adb logcat | grep -i "google\|calendar\|oauth"

# React Native
# Look for console.log messages in the code
```

## Common Issues

### Issue: "No server auth code received"
**Solution**: Ensure `webClientId` is correctly configured and matches your Google Cloud Console Web Client ID.

### Issue: "Play Services not available"
**Solution**: Update Google Play Services on the device or use a device with Google Play Services installed.

### Issue: Sign-in cancelled immediately
**Solution**: 
- Verify SHA-1 certificate is added to Google Cloud Console
- Check that package name matches in Google Cloud Console
- Ensure Calendar API is enabled

### Issue: Token not persisting
**Solution**: Check Convex schema includes the Google token fields in the users table.

## Next Steps

After successful connection:
1. Test creating a calendar event from a booking
2. Verify events appear in Google Calendar
3. Test token refresh when token expires
4. Implement calendar event updates and deletions
