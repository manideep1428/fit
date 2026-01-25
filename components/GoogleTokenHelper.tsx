import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, BorderRadius } from '@/constants/colors';

interface GoogleTokenHelperProps {
  onClose: () => void;
}

export default function GoogleTokenHelper({ onClose }: GoogleTokenHelperProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      title: 'Create Google Cloud Project',
      description: 'Set up a new project in Google Cloud Console',
      action: 'Open Google Cloud Console',
      url: 'https://console.cloud.google.com/',
      details: [
        'Go to Google Cloud Console',
        'Create a new project or select existing',
        'Note down your project ID',
      ],
    },
    {
      title: 'Enable Calendar API',
      description: 'Enable Google Calendar API for your project',
      action: 'Enable API',
      url: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
      details: [
        'Go to APIs & Services > Library',
        'Search for "Google Calendar API"',
        'Click on it and press "Enable"',
      ],
    },
    {
      title: 'Create OAuth Credentials',
      description: 'Set up OAuth 2.0 client credentials',
      action: 'Create Credentials',
      url: 'https://console.cloud.google.com/apis/credentials',
      details: [
        'Go to APIs & Services > Credentials',
        'Click "Create Credentials" > "OAuth 2.0 Client IDs"',
        'Choose "Web application" type',
        'Add authorized redirect URI: https://developers.google.com/oauthplayground',
      ],
    },
    {
      title: 'Get Access Token',
      description: 'Use OAuth Playground to get your token',
      action: 'Open OAuth Playground',
      url: 'https://developers.google.com/oauthplayground/',
      details: [
        'Go to OAuth 2.0 Playground',
        'Click settings (gear icon) and check "Use your own OAuth credentials"',
        'Enter your Client ID and Client Secret',
        'In Step 1: Select "Google Calendar API v3" scopes',
        'Click "Authorize APIs" and sign in',
        'In Step 2: Click "Exchange authorization code for tokens"',
        'Copy the Access Token',
      ],
    },
  ];

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open URL');
    });
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-6 py-4 flex-row items-center justify-between"
        style={{ backgroundColor: colors.surface }}
      >
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Google Calendar Setup
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          {steps.map((_, index) => (
            <View key={index} className="flex-row items-center flex-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: index + 1 <= currentStep ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-bold"
                  style={{ color: index + 1 <= currentStep ? '#FFF' : colors.textTertiary }}
                >
                  {index + 1}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View
                  className="flex-1 h-0.5 mx-2"
                  style={{ backgroundColor: index + 1 < currentStep ? colors.primary : colors.border }}
                />
              )}
            </View>
          ))}
        </View>
        <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
          Step {currentStep} of {steps.length}
        </Text>
      </View>

      {/* Current Step Content */}
      <ScrollView className="flex-1 px-6">
        <View
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                {currentStep}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {currentStepData.title}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {currentStepData.description}
              </Text>
            </View>
          </View>

          <View className="mb-6">
            {currentStepData.details.map((detail, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-sm" style={{ color: colors.text }}>
                  {detail}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleOpenUrl(currentStepData.url)}
            className="rounded-xl py-4 items-center mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="flex-row items-center">
              <Ionicons name="open-outline" size={20} color="#FFF" />
              <Text className="text-white font-semibold ml-2">
                {currentStepData.action}
              </Text>
            </View>
          </TouchableOpacity>

          {currentStep === 4 && (
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="font-semibold ml-2" style={{ color: colors.success }}>
                  Final Step
                </Text>
              </View>
              <Text className="text-sm" style={{ color: colors.text }}>
                Once you have your access token, paste it in the "Get Token Manually" option in the calendar connection screen.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View
        className="px-6 py-4 flex-row justify-between"
        style={{ backgroundColor: colors.surface }}
      >
        <TouchableOpacity
          onPress={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-3 rounded-xl"
          style={{
            backgroundColor: currentStep === 1 ? colors.border : colors.surfaceSecondary,
            opacity: currentStep === 1 ? 0.5 : 1,
          }}
        >
          <Text
            className="font-semibold"
            style={{ color: currentStep === 1 ? colors.textTertiary : colors.text }}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (currentStep < steps.length) {
              setCurrentStep(currentStep + 1);
            } else {
              onClose();
            }
          }}
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">
            {currentStep < steps.length ? 'Next' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}