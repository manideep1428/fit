import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10B981',
        borderLeftWidth: 5,
        backgroundColor: '#ECFDF5',
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#065F46',
      }}
      text2Style={{
        fontSize: 14,
        color: '#047857',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
        </View>
      )}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444',
        borderLeftWidth: 5,
        backgroundColor: '#FEF2F2',
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#991B1B',
      }}
      text2Style={{
        fontSize: 14,
        color: '#DC2626',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </View>
      )}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3B82F6',
        borderLeftWidth: 5,
        backgroundColor: '#EFF6FF',
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
      }}
      text2Style={{
        fontSize: 14,
        color: '#2563EB',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <Ionicons name="information-circle" size={28} color="#3B82F6" />
        </View>
      )}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#F59E0B',
        borderLeftWidth: 5,
        backgroundColor: '#FFFBEB',
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
      }}
      text2Style={{
        fontSize: 14,
        color: '#D97706',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <Ionicons name="warning" size={28} color="#F59E0B" />
        </View>
      )}
    />
  ),
};
