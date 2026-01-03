import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

interface TimeRange {
    startTime: string;
    endTime: string;
}

interface DayAvailability {
    dayOfWeek: number;
    enabled: boolean;
    timeRanges: TimeRange[];
}

export default function AvailabilityScreen() {
    const router = useRouter();
    const { user } = useUser();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
    const insets = useSafeAreaInsets();

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
    const [currentPicker, setCurrentPicker] = useState<{ 
        dayIndex: number; 
        rangeIndex: number; 
        type: 'start' | 'end';
    } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        if (existingAvailability !== undefined) {
            const newSchedule = DAYS.map((_, index) => {
                const found = existingAvailability.find((a: any) => a.dayOfWeek === index);
                
                // Handle migration from old schema (startTime/endTime) to new schema (timeRanges)
                if (found) {
                    let timeRanges: TimeRange[] = [];
                    
                    if (found.timeRanges && found.timeRanges.length > 0) {
                        timeRanges = found.timeRanges;
                    } else if ((found as any).startTime && (found as any).endTime) {
                        // Migrate old data
                        timeRanges = [{ startTime: (found as any).startTime, endTime: (found as any).endTime }];
                    } else {
                        timeRanges = [{ startTime: '09:00', endTime: '17:00' }];
                    }
                    
                    return {
                        dayOfWeek: index,
                        enabled: found.enabled,
                        timeRanges,
                    };
                }
                
                return {
                    dayOfWeek: index,
                    enabled: false,
                    timeRanges: [{ startTime: '09:00', endTime: '17:00' }],
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

    const addTimeRange = (dayIndex: number) => {
        const newSchedule = [...schedule];
        const lastRange = newSchedule[dayIndex].timeRanges[newSchedule[dayIndex].timeRanges.length - 1];
        
        // Parse the last end time and add 1 hour
        const [hours, minutes] = lastRange.endTime.split(':').map(Number);
        const newStartHour = hours;
        const newEndHour = Math.min(hours + 1, 23);
        
        const newStartTime = `${newStartHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        newSchedule[dayIndex].timeRanges.push({
            startTime: newStartTime,
            endTime: newEndTime,
        });
        
        setSchedule(newSchedule);
    };

    const deleteTimeRange = (dayIndex: number, rangeIndex: number) => {
        const newSchedule = [...schedule];
        
        // Don't allow deleting if it's the only time range
        if (newSchedule[dayIndex].timeRanges.length === 1) {
            Toast.show({
                type: 'error',
                text1: 'Cannot Delete',
                text2: 'At least one time range is required',
                position: 'top',
                visibilityTime: 2000,
            });
            return;
        }
        
        newSchedule[dayIndex].timeRanges.splice(rangeIndex, 1);
        setSchedule(newSchedule);
    };

    const openPicker = (dayIndex: number, rangeIndex: number, type: 'start' | 'end') => {
        const timeStr = type === 'start' 
            ? schedule[dayIndex].timeRanges[rangeIndex].startTime 
            : schedule[dayIndex].timeRanges[rangeIndex].endTime;
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);

        setTempDate(date);
        setCurrentPicker({ dayIndex, rangeIndex, type });
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
                newSchedule[currentPicker.dayIndex].timeRanges[currentPicker.rangeIndex].startTime = timeString;
            } else {
                newSchedule[currentPicker.dayIndex].timeRanges[currentPicker.rangeIndex].endTime = timeString;
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
                newSchedule[currentPicker.dayIndex].timeRanges[currentPicker.rangeIndex].startTime = timeString;
            } else {
                newSchedule[currentPicker.dayIndex].timeRanges[currentPicker.rangeIndex].endTime = timeString;
            }
            setSchedule(newSchedule);
        }
        setPickerVisible(false);
        setCurrentPicker(null);
    };

    const validateTimeRanges = (timeRanges: TimeRange[]): boolean => {
        for (const range of timeRanges) {
            const [startHour, startMin] = range.startTime.split(':').map(Number);
            const [endHour, endMin] = range.endTime.split(':').map(Number);
            
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            
            if (endMinutes <= startMinutes) {
                return false;
            }
        }
        return true;
    };

    const handleSave = async () => {
        if (!user?.id) return;
        
        // Validate all enabled days
        for (const day of schedule) {
            if (day.enabled && !validateTimeRanges(day.timeRanges)) {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid Time Range',
                    text2: `End time must be after start time for ${DAYS[day.dayOfWeek]}`,
                    position: 'top',
                    visibilityTime: 3000,
                });
                return;
            }
        }
        
        setSaving(true);
        try {
            await Promise.all(schedule.map(day =>
                saveAvailability({
                    trainerId: user.id,
                    dayOfWeek: day.dayOfWeek,
                    enabled: day.enabled,
                    timeRanges: day.timeRanges,
                    breaks: [],
                    sessionDuration: 60,
                })
            ));
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Availability updated successfully',
                position: 'top',
                visibilityTime: 2000,
            });
            
            setTimeout(() => router.back(), 500);
        } catch (error: any) {
            console.error('Error saving availability:', error instanceof Error ? error.message : 'Unknown error');
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to save availability',
                position: 'top',
                visibilityTime: 3000,
            });
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
            <View 
                className="px-6 pb-4 flex-row items-center justify-between"
                style={{ 
                    paddingTop: insets.top + 12,
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View className="flex-1 mx-4">
                    <Text className="text-xl font-bold" style={{ color: colors.text }}>
                        Availability
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                        Set your weekly schedule
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl items-center justify-center"
                    style={{ 
                        backgroundColor: saving ? colors.surfaceSecondary : colors.primary,
                        ...shadows.small,
                    }}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                        <Text className="text-sm font-semibold text-white">Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6 py-4">
                    {schedule.map((day, dayIndex) => (
                        <View
                            key={dayIndex}
                            className="rounded-2xl p-4 mb-3"
                            style={{ 
                                backgroundColor: colors.surface,
                                ...shadows.small,
                            }}
                        >
                            {/* Day Header */}
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-base font-bold" style={{ color: colors.text }}>
                                    {DAYS[dayIndex]}
                                </Text>
                                <Switch
                                    value={day.enabled}
                                    onValueChange={() => handleToggle(dayIndex)}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#FFF"
                                />
                            </View>

                            {/* Time Ranges */}
                            {day.enabled && (
                                <View>
                                    {day.timeRanges.map((range, rangeIndex) => (
                                        <View 
                                            key={rangeIndex}
                                            className="flex-row items-center mb-2"
                                        >
                                            {/* Start Time */}
                                            <TouchableOpacity
                                                onPress={() => openPicker(dayIndex, rangeIndex, 'start')}
                                                className="flex-1 py-2.5 rounded-xl items-center justify-center"
                                                style={{ 
                                                    backgroundColor: colors.surfaceSecondary,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                                    {range.startTime}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Separator */}
                                            <Text className="mx-3 text-sm" style={{ color: colors.textTertiary }}>
                                                -
                                            </Text>

                                            {/* End Time */}
                                            <TouchableOpacity
                                                onPress={() => openPicker(dayIndex, rangeIndex, 'end')}
                                                className="flex-1 py-2.5 rounded-xl items-center justify-center"
                                                style={{ 
                                                    backgroundColor: colors.surfaceSecondary,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                                    {range.endTime}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Add Button (only on last range) */}
                                            {rangeIndex === day.timeRanges.length - 1 && (
                                                <TouchableOpacity
                                                    onPress={() => addTimeRange(dayIndex)}
                                                    className="w-9 h-9 rounded-lg items-center justify-center ml-2"
                                                    style={{ 
                                                        backgroundColor: `${colors.primary}15`,
                                                    }}
                                                >
                                                    <Ionicons name="add" size={20} color={colors.primary} />
                                                </TouchableOpacity>
                                            )}

                                            {/* Delete Button (only if more than 1 range) */}
                                            {day.timeRanges.length > 1 && (
                                                <TouchableOpacity
                                                    onPress={() => deleteTimeRange(dayIndex, rangeIndex)}
                                                    className="w-9 h-9 rounded-lg items-center justify-center ml-2"
                                                    style={{ 
                                                        backgroundColor: `${colors.error}15`,
                                                    }}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* DateTimePicker Modal/Overlay */}
            {pickerVisible && (
                Platform.OS === 'ios' ? (
                    <View 
                        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl" 
                        style={{ 
                            backgroundColor: colors.surface, 
                            ...shadows.large, 
                            paddingBottom: insets.bottom + 20,
                        }}
                    >
                        <View className="flex-row justify-between items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text className="text-base" style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text className="font-semibold text-base" style={{ color: colors.text }}>Select Time</Text>
                            <TouchableOpacity onPress={confirmIOSDate}>
                                <Text className="text-base font-bold" style={{ color: colors.primary }}>Done</Text>
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
