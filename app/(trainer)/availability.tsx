import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedCard } from '@/components/AnimatedCard';

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

interface DayAvailability {
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
}

export default function AvailabilityScreen() {
    const router = useRouter();
    const { user } = useUser();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

    const existingAvailability = useQuery(
        api.availability.getTrainerAvailability,
        user?.id ? { trainerId: user.id } : 'skip'
    );

    const saveAvailability = useMutation(api.availability.saveAvailability);

    const [schedule, setSchedule] = useState<DayAvailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Time picker state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [currentPicker, setCurrentPicker] = useState<{ dayIndex: number, type: 'start' | 'end' } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        if (existingAvailability) {
            const newSchedule = DAYS.map((_, index) => {
                const found = existingAvailability.find((a: any) => a.dayOfWeek === index);
                return {
                    dayOfWeek: index,
                    enabled: found ? found.enabled : false,
                    startTime: found ? found.startTime : '09:00',
                    endTime: found ? found.endTime : '17:00',
                };
            });
            setSchedule(newSchedule);
            setLoading(false);
        }
    }, [existingAvailability]);

    const handleToggle = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule[index].enabled = !newSchedule[index].enabled;
        setSchedule(newSchedule);
    };

    const openPicker = (index: number, type: 'start' | 'end') => {
        const timeStr = type === 'start' ? schedule[index].startTime : schedule[index].endTime;
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);

        setTempDate(date);
        setCurrentPicker({ dayIndex: index, type });
        setPickerVisible(true);
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setPickerVisible(false);
        }

        if (selectedDate && currentPicker) {
            if (Platform.OS === 'android' && event.type === 'dismissed') return;

            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            const newSchedule = [...schedule];
            if (currentPicker.type === 'start') {
                newSchedule[currentPicker.dayIndex].startTime = timeString;
            } else {
                newSchedule[currentPicker.dayIndex].endTime = timeString;
            }
            setSchedule(newSchedule);

            if (Platform.OS === 'android') {
                setCurrentPicker(null);
            }
        }
    };

    const confirmIOSDate = () => {
        if (currentPicker && tempDate) {
            const hours = tempDate.getHours().toString().padStart(2, '0');
            const minutes = tempDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            const newSchedule = [...schedule];
            if (currentPicker.type === 'start') {
                newSchedule[currentPicker.dayIndex].startTime = timeString;
            } else {
                newSchedule[currentPicker.dayIndex].endTime = timeString;
            }
            setSchedule(newSchedule);
        }
        setPickerVisible(false);
        setCurrentPicker(null);
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            await Promise.all(schedule.map(day =>
                saveAvailability({
                    trainerId: user.id,
                    dayOfWeek: day.dayOfWeek,
                    enabled: day.enabled,
                    startTime: day.startTime,
                    endTime: day.endTime,
                    breaks: [],
                    sessionDuration: 60, // Default duration
                })
            ));
            Alert.alert('Success', 'Availability updated successfully');
            router.back();
        } catch (error) {
            console.error('Error saving availability:', error);
            Alert.alert('Error', 'Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !schedule.length) {
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
                    Availability
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="w-10 h-10 items-center justify-center"
                >
                    {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="checkmark" size={24} color={colors.primary} />}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
                {schedule.map((day, index) => (
                    <AnimatedCard
                        key={index}
                        delay={index * 50}
                        style={{ marginBottom: 16 }}
                        elevation="small"
                        borderRadius="large"
                    >
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                                {DAYS[index]}
                            </Text>
                            <Switch
                                value={day.enabled}
                                onValueChange={() => handleToggle(index)}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        {day.enabled && (
                            <View className="flex-row items-center justify-between mt-2 pt-2 border-t" style={{ borderTopColor: colors.border }}>
                                <TouchableOpacity
                                    onPress={() => openPicker(index, 'start')}
                                    className="flex-1 items-center py-2 rounded-lg mr-2"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Start</Text>
                                    <Text className="text-base font-medium" style={{ color: colors.primary }}>
                                        {day.startTime}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={{ color: colors.textTertiary }}>-</Text>

                                <TouchableOpacity
                                    onPress={() => openPicker(index, 'end')}
                                    className="flex-1 items-center py-2 rounded-lg ml-2"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>End</Text>
                                    <Text className="text-base font-medium" style={{ color: colors.primary }}>
                                        {day.endTime}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </AnimatedCard>
                ))}

                <View className="h-10" />
            </ScrollView>

            {/* DateTimePicker Modal/Overlay */}
            {pickerVisible && (
                Platform.OS === 'ios' ? (
                    <View className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl" style={{ backgroundColor: colors.surface, ...shadows.large, paddingBottom: 20 }}>
                        <View className="flex-row justify-between items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text className="font-semibold" style={{ color: colors.text }}>Select Time</Text>
                            <TouchableOpacity onPress={confirmIOSDate}>
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="p-4 items-center">
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                display="spinner"
                                onChange={(e, date) => setTempDate(date || tempDate)}
                                textColor={colors.text}
                            />
                        </View>
                    </View>
                ) : (
                    <DateTimePicker
                        value={tempDate}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                    />
                )
            )}
        </View>
    );
}
