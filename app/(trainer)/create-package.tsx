import { useRouter } from "expo-router";
import { useEffect } from "react";

// This file is deprecated - redirects to the new plans management
export default function CreatePackageScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new packages screen which has the plan creation modal
    router.replace("/(trainer)/packages");
  }, []);

  return null;
}
