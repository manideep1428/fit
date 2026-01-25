# Google Calendar Quick Fix Guide

## Most Common Issue: Sign-In Opens But Doesn't Complete

### Quick Fix (5 minutes)

#### 1. Get Your SHA-1 Certificate
```bash
cd android
./gradlew signingReport
```
Copy the SHA-1 fingerprint from the output (under "Variant: debug")

#### 2. Add SHA-1 to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **Android OAuth 2.0 Client ID**
5. Click **Edit**
6. Add your SHA-1 fingerprint
7. Verify package name is: `com.manideep1428.fit`
8. Click **Save**

#### 3. Enable Google Calendar API
1. In Google Cloud Console
2. Navigate to: **APIs & Services** → **Library**
3. Search for "Google Calendar API"
4. Click **Enable**

#### 4. Rebuild and Test
```bash
# Clean build
cd android
./gradlew clean
cd ..

# Reinstall app
npm run android
```

#### 5. Test Connection
1. Open app
2. Go to Google Calendar settings
3. Click "Connect Google Calendar"
4. Select Google account
5. Grant calendar permissions
6. Should see success message!

---

## If Still Not Working

### Check Client IDs Match

In `app/google.tsx`, verify these match your Google Cloud Console:

```typescript
iosClientId: "YOUR-IOS-CLIENT-ID.apps.googleusercontent.com"
webClientId: "YOUR-WEB-CLIENT-ID.apps.googleusercontent.com"
```

To find your Client IDs:
1. Google Cloud Console → **APIs & Services** → **Credentials**
2. Look for:
   - **Android OAuth 2.0 Client ID** (use the Web Client ID from the same project)
   - **iOS OAuth 2.0 Client ID**

### Verify OAuth Consent Screen

1. Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Make sure it's configured with:
   - App name
   - User support email
   - Developer contact email
3. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

---

## Testing Checklist

- [ ] SHA-1 added to Google Cloud Console
- [ ] Package name matches: `com.manideep1428.fit`
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] Client IDs match in code
- [ ] App rebuilt after changes
- [ ] Testing on device with Google Play Services

---

## Still Having Issues?

Check the full guides:
- `.agent/GOOGLE_CALENDAR_SETUP.md` - Complete setup guide
- `.agent/GOOGLE_CALENDAR_TEST.md` - Detailed testing guide

Or check logs:
```bash
adb logcat | grep -E "GoogleSignIn|Calendar|OAuth"
```
