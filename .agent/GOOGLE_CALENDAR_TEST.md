# Google Calendar Integration Testing Guide

## Pre-Testing Checklist

### 1. Verify Google Cloud Console Setup
- [ ] Project created in Google Cloud Console
- [ ] Google Calendar API enabled
- [ ] OAuth 2.0 credentials created:
  - [ ] Android OAuth Client ID (with correct package name and SHA-1)
  - [ ] Web OAuth Client ID (for server auth code)
- [ ] OAuth consent screen configured

### 2. Get SHA-1 Fingerprint
```bash
cd android
./gradlew signingReport
```
Look for the SHA-1 under `Variant: debug` and `Config: debug`

### 3. Verify Client IDs Match
Check that the client IDs in `app/google.tsx` match your Google Cloud Console:
- iOS Client ID: `1083333912631-gdfm0chhuaedqpth2hqlun6270g5srrq.apps.googleusercontent.com`
- Web Client ID: `1083333912631-2une8flb8bm7j1b90pg71muc98mu5t8v.apps.googleusercontent.com`

## Testing Steps

### Step 1: Clean Build
```bash
# Clear cache
npm run android -- --reset-cache

# Or for a fresh install
cd android
./gradlew clean
cd ..
npm run android
```

### Step 2: Test Sign-In Flow

1. **Open the app**
2. **Navigate to Google Calendar settings**
   - For trainers: Profile → Settings → Google Calendar
   - For clients: Profile → Settings → Google Calendar
3. **Click "Connect Google Calendar"**
4. **Expected behavior:**
   - Google account picker appears
   - Select your Google account
   - Permission screen shows requesting Calendar access
   - Grant permissions
   - Returns to app with success message

### Step 3: Verify Connection

1. **Check UI Status**
   - Status should show "Connected"
   - Email address should be displayed
   - "Disconnect Calendar" button should be visible

2. **Check Debug Info (Development Mode)**
   - Platform information displayed
   - "Token stored: Yes" should appear
   - Connection timestamp shown

3. **Check Convex Database**
   - Open Convex dashboard
   - Navigate to `users` table
   - Find your user record
   - Verify fields are populated:
     - `googleAccessToken`: Should have a value
     - `googleRefreshToken`: Should have a value
     - `googleTokenExpiry`: Should be a timestamp

### Step 4: Test Calendar Event Creation

```typescript
// This will be implemented in booking flow
// For now, you can test manually in the app
```

## Common Issues and Solutions

### Issue 1: Sign-in opens but immediately closes
**Symptoms:** Google sign-in screen flashes and closes
**Causes:**
- SHA-1 fingerprint not added to Google Cloud Console
- Package name mismatch
- Client IDs incorrect

**Solution:**
```bash
# Get SHA-1
cd android
./gradlew signingReport

# Add to Google Cloud Console:
# 1. Go to Credentials
# 2. Edit Android OAuth Client
# 3. Add SHA-1 certificate fingerprint
# 4. Verify package name is: com.manideep1428.fit
```

### Issue 2: "No server auth code received"
**Symptoms:** Error message after selecting Google account
**Causes:**
- Web Client ID not configured
- `offlineAccess` not enabled
- `forceCodeForRefreshToken` not set

**Solution:**
- Verify `webClientId` in `app/google.tsx` matches Google Cloud Console
- Ensure Web OAuth Client ID exists in Google Cloud Console
- Check that the code has `offlineAccess: true` and `forceCodeForRefreshToken: true`

### Issue 3: "Play Services not available"
**Symptoms:** Error about Google Play Services
**Causes:**
- Testing on emulator without Google Play Services
- Outdated Google Play Services on device

**Solution:**
- Use a device/emulator with Google Play Services
- Update Google Play Services on the device
- Use an emulator with Google APIs (not AOSP)

### Issue 4: Permissions not requested
**Symptoms:** Sign-in completes but no calendar permission prompt
**Causes:**
- Scopes not properly configured
- OAuth consent screen not set up

**Solution:**
- Verify scopes in `GoogleSignin.configure()`:
  ```typescript
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
  ]
  ```
- Check OAuth consent screen in Google Cloud Console
- Add calendar scopes to consent screen

### Issue 5: Token not persisting
**Symptoms:** Connection status resets after app restart
**Causes:**
- Convex mutation failing
- Schema fields missing
- User not found in database

**Solution:**
- Check Convex logs for errors
- Verify schema includes Google token fields
- Ensure user exists in database before connecting

## Debug Logging

### Enable Verbose Logging

Add to your code temporarily:
```typescript
// In app/google.tsx, add after imports:
console.log("=== Google Sign-In Debug ===");

// In handleCalendarSignIn, add:
console.log("1. Starting sign-in...");
console.log("2. Play Services check...");
console.log("3. Sign-in response:", JSON.stringify(response, null, 2));
console.log("4. Tokens:", { hasAccessToken: !!tokens.accessToken });
console.log("5. Storing in Convex...");
```

### View Logs

```bash
# Android
adb logcat | grep -E "GoogleSignIn|Calendar|OAuth"

# React Native
# Check Metro bundler console
```

## Success Criteria

✅ Google account picker appears
✅ Calendar permissions requested
✅ Success message displayed
✅ Status shows "Connected"
✅ Email address visible
✅ Tokens stored in Convex
✅ Debug info shows "Token stored: Yes"
✅ Can disconnect and reconnect

## Next Steps After Successful Connection

1. Implement calendar event creation on booking
2. Add event update on booking modification
3. Add event deletion on booking cancellation
4. Implement token refresh logic
5. Add error handling for expired tokens
6. Test calendar sync across multiple bookings
