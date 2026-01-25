# Clerk Google OAuth Configuration Guide

## Step-by-Step Setup

### 1. Get Google OAuth Credentials

#### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project or create a new one
3. Navigate to "APIs & Services" → "Credentials"

#### B. Create OAuth 2.0 Client ID
1. Click "Create Credentials" → "OAuth client ID"
2. Select application type:
   - **iOS**: iOS application
   - **Android**: Android application
   - **Web**: Web application (for Expo web)
3. Configure the OAuth consent screen if prompted

#### C. Get Your Credentials
You'll need:
- **Client ID**: `1083333912631-2une8flb8bm7j1b90pg71muc98mu5t8v.apps.googleusercontent.com`
- **Client Secret**: (from Google Cloud Console)

### 2. Configure Clerk Dashboard

#### A. Navigate to Social Connections
1. Go to https://dashboard.clerk.com/
2. Select your application
3. Go to "User & Authentication" → "Social Connections"
4. Find "Google" in the list

#### B. Enable Google OAuth
1. Toggle "Enable" for Google
2. Click "Configure" or the settings icon

#### C. Add Credentials
```
Client ID: [Your Google Client ID]
Client Secret: [Your Google Client Secret]
```

#### D. Configure Scopes
Add these scopes for calendar access:
```
email
profile
openid
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

#### E. Set Redirect URLs
For development:
```
exp://[your-ip]:8081
```

For production:
```
https://your-app-domain.com/oauth-callback
```

### 3. Configure Your App

#### A. Environment Variables
In `.env.local`:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=1083333912631-2une8flb8bm7j1b90pg71muc98mu5t8v.apps.googleusercontent.com
```

#### B. App Configuration
In `app.json`, ensure you have:
```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "ios": {
      "bundleIdentifier": "com.manideep1428.fit"
    },
    "android": {
      "package": "com.manideep1428.fit"
    }
  }
}
```

### 4. Google Cloud Console - Additional Setup

#### A. Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - Google Calendar API
   - Google+ API (for profile info)

#### B. Configure OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Choose "External" (for public apps)
3. Fill in required information:
   - App name: "Fit Trainer App"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/calendar`
   - `.../auth/calendar.events`
5. Add test users (for testing phase)

#### C. Configure Authorized Redirect URIs
Add these URIs:
```
# For Clerk
https://[your-clerk-frontend-api]/v1/oauth_callback

# For development
exp://localhost:8081
exp://[your-ip]:8081

# For production
https://your-app-domain.com/oauth-callback
```

### 5. Android-Specific Setup

#### A. SHA-1 Fingerprint
1. Get your SHA-1 fingerprint:
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore /path/to/your/keystore -alias your-alias
```

2. Add SHA-1 to Google Cloud Console:
   - Go to your OAuth client
   - Add the SHA-1 fingerprint

#### B. Package Name
Ensure it matches: `com.manideep1428.fit`

### 6. iOS-Specific Setup

#### A. Bundle Identifier
Ensure it matches: `com.manideep1428.fit`

#### B. URL Schemes
In `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.manideep1428.fit",
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

### 7. Testing

#### A. Test Sign In
1. Run your app: `npm start`
2. Navigate to sign-in screen
3. Click "Sign with Google"
4. Should open Google OAuth consent screen
5. Grant permissions
6. Should redirect back to app

#### B. Verify Token Storage
Check Clerk Dashboard → Users to see:
- User created with Google account
- Email verified automatically
- Profile picture from Google

#### C. Check Convex
Verify user record created in Convex with:
- Clerk ID
- Email
- Full name
- Role

### 8. Troubleshooting

#### Common Issues

**"Invalid client" error**
- Check Client ID matches in Clerk and Google Console
- Verify redirect URIs are correct

**"Access denied" error**
- Check OAuth consent screen is configured
- Add your email as test user
- Verify scopes are correct

**"Redirect URI mismatch"**
- Add all possible redirect URIs to Google Console
- Check Clerk's redirect URI in dashboard

**App doesn't redirect back**
- Verify URL scheme in app.json
- Check expo-auth-session configuration
- Ensure WebBrowser.maybeCompleteAuthSession() is called

### 9. Production Checklist

Before going live:
- [ ] OAuth consent screen is verified by Google
- [ ] Production redirect URIs are configured
- [ ] Release keystore SHA-1 is added (Android)
- [ ] App Store bundle ID matches (iOS)
- [ ] Environment variables are set for production
- [ ] Test OAuth flow on production build
- [ ] Privacy policy and terms of service are linked

### 10. Security Best Practices

1. **Never commit secrets**: Keep Client Secret in Clerk only
2. **Use HTTPS**: Always use HTTPS for redirect URIs in production
3. **Validate tokens**: Let Clerk handle token validation
4. **Limit scopes**: Only request scopes you need
5. **Monitor usage**: Check Google Cloud Console for API usage

## Quick Reference

### Clerk OAuth Flow
```typescript
const { startSSOFlow } = useSSO();

const result = await startSSOFlow({
  strategy: 'oauth_google',
  redirectUrl: AuthSession.makeRedirectUri(),
});

if (result.createdSessionId) {
  await setActive({ session: result.createdSessionId });
}
```

### Required Scopes
```
email                                          # User email
profile                                        # User profile
openid                                         # OpenID Connect
https://www.googleapis.com/auth/calendar       # Calendar access
https://www.googleapis.com/auth/calendar.events # Calendar events
```

### Important URLs
- Google Cloud Console: https://console.cloud.google.com/
- Clerk Dashboard: https://dashboard.clerk.com/
- Google OAuth Playground: https://developers.google.com/oauthplayground/

## Support

If you encounter issues:
1. Check Clerk documentation: https://clerk.com/docs
2. Check Google OAuth docs: https://developers.google.com/identity/protocols/oauth2
3. Review Expo auth docs: https://docs.expo.dev/guides/authentication/
