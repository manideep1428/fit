# UI Changes - Visual Guide

## Sign-In Screen

### Before
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  Welcome Back               │
│  Sign in to continue...     │
│                             │
│  Email                      │
│  [email input field]        │
│                             │
│  Password                   │
│  [password input field]     │
│                             │
│  Forgot Password?           │
│                             │
│  [Sign In Button]           │
│                             │
│  Don't have an account?     │
│  Sign Up                    │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  Welcome Back               │
│  Sign in to continue...     │
│                             │
│  Email                      │
│  [email input field]        │
│                             │
│  Password                   │
│  [password input field]     │
│                             │
│  Forgot Password?           │
│                             │
│  [Sign In Button]           │
│                             │
│  ─── or continue with ───   │  ← NEW
│                             │
│  [🔵 Sign with Google]      │  ← NEW
│                             │
│  Don't have an account?     │
│  Sign Up                    │
└─────────────────────────────┘
```

## Sign-Up Screen

### Before
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  Become a Trainer           │
│  Create your trainer...     │
│                             │
│  [Trainer Badge]            │
│                             │
│  Full Name                  │
│  [name input field]         │
│                             │
│  Email                      │
│  [email input field]        │
│                             │
│  Phone Number               │
│  [phone input field]        │
│                             │
│  Password                   │
│  [password input field]     │
│                             │
│  [Create Trainer Account]   │
│                             │
│  Already have an account?   │
│  Sign In                    │
│                             │
│  [Client Info Box]          │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  Become a Trainer           │
│  Create your trainer...     │
│                             │
│  [Trainer Badge]            │
│                             │
│  Full Name                  │
│  [name input field]         │
│                             │
│  Email                      │
│  [email input field]        │
│                             │
│  Phone Number               │
│  [phone input field]        │
│                             │
│  Password                   │
│  [password input field]     │
│                             │
│  [Create Trainer Account]   │
│                             │
│  ─── or continue with ───   │  ← NEW
│                             │
│  [🔵 Sign with Google]      │  ← NEW
│                             │
│  Already have an account?   │
│  Sign In                    │
│                             │
│  [Client Info Box]          │
└─────────────────────────────┘
```

## Google OAuth Button Details

### Visual Design
```
┌─────────────────────────────────────┐
│  🔵  Sign with Google               │
│  [Google Logo] [Text]               │
└─────────────────────────────────────┘
```

### States

#### Normal State
- Background: Surface color with border
- Text: "Sign with Google"
- Icon: Google logo (red)
- Shadow: Small elevation

#### Loading State
```
┌─────────────────────────────────────┐
│  ⟳  Connecting...                   │
│  [Spinner] [Text]                   │
└─────────────────────────────────────┘
```

#### Hover/Press State (Mobile)
- Slight opacity change
- Haptic feedback
- Visual press animation

## Divider Design

```
────────── or continue with ──────────
[thin line] [text] [thin line]
```

- Line color: Border color (subtle)
- Text color: Secondary text color
- Spacing: 24px top and bottom

## Color Scheme

### Light Mode
- Button background: `#FFFFFF` (surface)
- Button border: `#E5E7EB` (border)
- Button text: `#111827` (text)
- Google logo: `#DB4437` (Google red)
- Divider line: `#E5E7EB` (border)
- Divider text: `#6B7280` (textSecondary)

### Dark Mode
- Button background: `#1F2937` (surface)
- Button border: `#374151` (border)
- Button text: `#F9FAFB` (text)
- Google logo: `#DB4437` (Google red)
- Divider line: `#374151` (border)
- Divider text: `#9CA3AF` (textSecondary)

## Spacing & Layout

### Button Spacing
- Margin top: 24px (from previous element)
- Margin bottom: 24px (to next element)
- Padding vertical: 16px
- Padding horizontal: 16px

### Divider Spacing
- Margin top: 24px
- Margin bottom: 24px
- Line height: 1px
- Text padding: 16px horizontal

### Icon Spacing
- Icon size: 24x24px
- Icon margin right: 12px
- Vertical alignment: center

## Responsive Behavior

### Mobile (< 768px)
- Full width buttons
- Comfortable touch targets (44px min height)
- Adequate spacing between elements

### Tablet/Desktop (≥ 768px)
- Same layout (mobile-first design)
- Maintains consistent spacing
- Centered content

## Accessibility

### Button
- Accessible name: "Sign with Google"
- Role: button
- Touch target: 44x44px minimum
- Keyboard accessible: Yes
- Screen reader friendly: Yes

### Loading State
- Announces: "Connecting to Google"
- Shows spinner with accessible label
- Disables interaction during loading

### Error State
- Shows error message
- Announces error to screen readers
- Provides retry option

## Animation

### Button Press
```
Normal → Pressed → Released
1.0    → 0.95    → 1.0 (scale)
```

### Loading Spinner
```
Continuous rotation
360° every 1 second
```

### Success Transition
```
Button → Success → Navigate
Fade out → Show checkmark → Redirect
```

## User Flow

### Sign In with Google
```
1. User taps "Sign with Google"
   ↓
2. Button shows loading state
   ↓
3. Browser opens with Google OAuth
   ↓
4. User authenticates with Google
   ↓
5. Browser closes
   ↓
6. App shows success
   ↓
7. Navigate to home screen
```

### Error Handling
```
1. User taps "Sign with Google"
   ↓
2. Button shows loading state
   ↓
3. Error occurs
   ↓
4. Button returns to normal
   ↓
5. Toast shows error message
   ↓
6. User can retry
```

## Implementation Details

### Component Structure
```tsx
<TouchableOpacity>
  {loading ? (
    <View>
      <ActivityIndicator />
      <Text>Connecting...</Text>
    </View>
  ) : (
    <>
      <Ionicons name="logo-google" />
      <Text>Sign with Google</Text>
    </>
  )}
</TouchableOpacity>
```

### Styling
```tsx
style={{
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  ...shadows.small,
}}
```

## Testing Checklist

Visual Testing:
- [ ] Button displays correctly in light mode
- [ ] Button displays correctly in dark mode
- [ ] Loading state shows spinner
- [ ] Google logo is visible and correct color
- [ ] Divider is properly aligned
- [ ] Spacing is consistent
- [ ] Touch target is adequate (44px min)
- [ ] Animations are smooth
- [ ] Error states display properly

Functional Testing:
- [ ] Button triggers OAuth flow
- [ ] Loading state prevents double-tap
- [ ] Success navigates correctly
- [ ] Errors show toast messages
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Accessible with screen reader

## Notes

- Design follows existing app patterns
- Uses app's color system
- Consistent with other buttons
- Follows platform guidelines
- Accessible and user-friendly
