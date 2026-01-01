import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { showToast } from '@/utils/toast';

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast.error('Fill all fields');
      return;
    }

    if (newPassword.length < 8) {
      showToast.error('Min 8 characters required');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error('Passwords don\'t match');
      return;
    }

    setChangingPassword(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });

      showToast.success('Password changed');
      router.back();
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast.error(error.errors?.[0]?.message || 'Wrong current password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center" style={{ color: colors.text }}>
          Change Password
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
              Password Requirements
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Your new password must be at least 8 characters long.
          </Text>
        </View>

        {/* Current Password */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Current Password
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            New Password
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Confirm New Password
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="rounded-xl py-4 items-center mb-6"
          style={{
            backgroundColor: currentPassword && newPassword && confirmPassword ? colors.primary : colors.border,
            ...shadows.medium,
          }}
        >
          {changingPassword ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-base">Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
