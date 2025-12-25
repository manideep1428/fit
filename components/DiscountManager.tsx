import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface DiscountManagerProps {
  trainerId: string;
  clientId: string;
  clientName: string;
}

export default function DiscountManager({ trainerId, clientId, clientName }: DiscountManagerProps) {
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get existing discount for this client
  const existingRule = useQuery(api.pricingRules.getClientPricingRules, {
    trainerId,
    clientId,
  });

  const createDiscount = useMutation(api.pricingRules.createPricingRule);
  const updateDiscount = useMutation(api.pricingRules.updatePricingRule);
  const deleteDiscount = useMutation(api.pricingRules.deletePricingRule);

  const handleAddDiscount = async () => {
    const discount = parseFloat(discountPercentage);
    
    if (isNaN(discount) || discount < 0 || discount > 100) {
      Alert.alert('Invalid Discount', 'Please enter a discount between 0 and 100');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description for the discount');
      return;
    }

    setIsLoading(true);
    try {
      await createDiscount({
        trainerId,
        clientId,
        discountPercentage: discount,
        description: description.trim(),
      });

      Alert.alert(
        'Success',
        `${discount}% discount added for ${clientName}. They will receive a push notification!`
      );
      
      setDiscountPercentage('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add discount. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDiscount = async () => {
    if (!existingRule?._id) return;

    const discount = parseFloat(discountPercentage);
    
    if (isNaN(discount) || discount < 0 || discount > 100) {
      Alert.alert('Invalid Discount', 'Please enter a discount between 0 and 100');
      return;
    }

    setIsLoading(true);
    try {
      await updateDiscount({
        ruleId: existingRule._id as Id<'pricingRules'>,
        discountPercentage: discount,
        description: description.trim() || existingRule.description,
      });

      Alert.alert(
        'Success',
        `Discount updated to ${discount}% for ${clientName}. They will receive a push notification!`
      );
      
      setDiscountPercentage('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update discount. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!existingRule?._id) return;

    Alert.alert(
      'Remove Discount',
      `Are you sure you want to remove the ${existingRule.discountPercentage}% discount for ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteDiscount({
                ruleId: existingRule._id as Id<'pricingRules'>,
              });

              Alert.alert(
                'Success',
                `Discount removed for ${clientName}. They will receive a push notification.`
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to remove discount. Please try again.');
              console.error(error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        Discount for {clientName}
      </Text>

      {existingRule && (
        <View className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <Text className="text-green-800 dark:text-green-200 font-semibold">
            Current Discount: {existingRule.discountPercentage}%
          </Text>
          <Text className="text-green-700 dark:text-green-300 text-sm mt-1">
            {existingRule.description}
          </Text>
        </View>
      )}

      <View className="space-y-3">
        <View>
          <Text className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Discount Percentage (0-100)
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            placeholder="e.g., 10"
            keyboardType="numeric"
            value={discountPercentage}
            onChangeText={setDiscountPercentage}
            editable={!isLoading}
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            placeholder="e.g., Loyalty discount"
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            multiline
          />
        </View>

        <View className="flex-row space-x-2">
          {existingRule ? (
            <>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
                onPress={handleUpdateDiscount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Update Discount</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-lg py-3 items-center"
                onPress={handleRemoveDiscount}
                disabled={isLoading}
              >
                <Text className="text-white font-semibold">Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className="flex-1 bg-green-500 rounded-lg py-3 items-center"
              onPress={handleAddDiscount}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Add Discount</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <Text className="text-blue-800 dark:text-blue-200 text-xs">
          💡 {existingRule 
            ? 'Client will receive a push notification when you update or remove their discount.'
            : 'Client will receive a push notification when you add a discount.'}
        </Text>
      </View>
    </View>
  );
}
