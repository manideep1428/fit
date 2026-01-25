# Google OAuth Setup with Clerk

## Overview
This app now uses Clerk's OAuth flow for Google authentication instead of React Native Google Sign-In for the main authentication flow. The `@react-native-google-signin/google-signin` package is kept installed for future Google Calendar integration.

## Changes Made

### 1. Updated `app/google.tsx`
- Removed direct usage of `@react-native-google-signin/google-signin` for authentication
- Now uses Clerk's `useSSO()` hook with `oauth_google` strategy
- Kept the package commented out for future calendar integration
- Uses `expo-web-browser` and `expo-auth-session` for OAuth flow

### 2. Updated Sign-In Page (`app/(auth)/sign-in.tsx`)
- Added `GoogleOAuthButton` component
- Added divider with "or continue with" text
- Imports the reusable OAuth button component

### 3. Updated Sign-Up Page (`app/(auth)/sign-up.tsx`)
- Added `GoogleOAuthButton` component
- Added divider with "or continue with" text
- Consistent OAuth experience across sign-in and sign-up

### 4. GoogleOAuthButton Component (`components/GoogleOAuthButton.tsx`)
- Already implemented with Clerk's OAuth flow
- Handles both sign-in and sign-up modes
- Uses `startSSOFlow()` with `oauth_google` strategy
- Includes proper error handling and loading states

## How It Works

### Authentication Flow
1. User clicks "Sign with Google" button
2. `startSSOFlow()` is called with `strategy: 'oauth_google'`
3. Browser opens for Google OAuth consent
4. User authenticates with Google
5. Clerk handles the OAuth callback
6. Session is created and user is redirected to appropriate screen

### For Calendar Integration (Future)
The `@react-native-google-signin/google-signin` package remains installed and can be used specifically for:
- Requesting Google Calendar scopes
- Getting calendar-specific access tokens
- Managing calendar events

## Clerk Configuration Required

### In Clerk Dashboard:
1. Go to your application in Clerk Dashboard
2. Navigate to "Social Connections" or "OAuth"
3. Enable Google OAuth provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Configure OAuth scopes (for calendar, add):
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
6. Set redirect URLs:
   - Development: Your Expo development URL
   - Production: Your app's production URL

### Environment Variables
Make sure these are set in your `.env.local`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## Testing

### Sign In with Google
1. Navigate to sign-in screen
2. Click "Sign with Google" button
3. Complete Google OAuth flow
4. Should be redirected to appropriate screen based on role

### Sign Up with Google
1. Navigate to sign-up screen
2. Click "Sign with Google" button
3. Complete Google OAuth flow
4. New account is created with Google profile info
5. Should be redirected to role selection or setup

## Benefits of This Approach

1. **Unified Authentication**: All auth flows go through Clerk
2. **Better Security**: Clerk handles OAuth tokens and session management
3. **Simpler Code**: No need to manage Google Sign-In SDK separately
4. **Future-Ready**: Can still use RN Google Sign-In for calendar-specific features
5. **Cross-Platform**: Works consistently on iOS, Android, and Web

## Next Steps

1. Configure Google OAuth in Clerk Dashboard
2. Test sign-in and sign-up flows
3. Verify user creation in Convex
4. Implement calendar integration using the existing package when needed

## Notes

- The React Native Google Sign-In package is NOT removed, just not used for authentication
- All authentication now goes through Clerk's OAuth flow
- Calendar integration can be added later using the existing package
- Make sure to handle OAuth scopes properly in Clerk configuration
