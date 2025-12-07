import { View, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutsScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
      <Ionicons name="barbell-outline" size={80} color={colors.textTertiary} />
      <Text className="text-2xl font-bold mt-6" style={{ color: colors.text }}>
        Workouts
      </Text>
      <Text className="mt-2 text-center" style={{ color: colors.textSecondary }}>
        Coming soon...
      </Text>
    </View>
  );
}
