import { Stack, Redirect } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

export default function AuthLayout() {
  const { user, isLoaded } = useUser();

  // If user is already logged in, redirect them to index (which will handle role-based routing)
  // EXCEPT for role-selection and trainer-setup which are part of the onboarding flow
  if (
    isLoaded &&
    user &&
    user.unsafeMetadata?.role === "trainer" &&
    user.unsafeMetadata?.profileCompleted
  ) {
    return <Redirect href="/(trainer)" />;
  }

  if (isLoaded && user && user.unsafeMetadata?.role === "client") {
    return <Redirect href="/(client)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="phone-number" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="trainer-setup" />
    </Stack>
  );
}
