import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { showToast } from '@/utils/toast';

export default function PricingAdminScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [isGlobalDiscount, setIsGlobalDiscount] = useState(false);

  const pricingRules = useQuery(
    api.pricingRules.getTrainerPricingRules,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const clients = useQuery(
    api.users.getTrainerClients,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const createPricingRule = useMutation(api.pricingRules.createPricingRule);
  const updatePricingRule = useMutation(api.pricingRules.updatePricingRule);
  const deletePricingRule = useMutation(api.pricingRules.deletePricingRule);

  const handleSaveDiscount = async () => {
    if (!discountPercentage) {
      showToast.error('Please enter discount percentage');
      return;
    }

    const discount = parseFloat(discountPercentage);
    if (discount < 0 || discount > 100) {
      showToast.error('Discount must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      await createPricingRule({
        trainerId: user!.id,
        clientId: isGlobalDiscount ? undefined : selectedClient?.clerkId,
        discountPercentage: discount,
        description: description || (isGlobalDiscount ? 'Global discount for all clients' : `Discount for ${selectedClient?.fullName}`),
      });

      showToast.success('Discount created!');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating discount:', error);
      showToast.error('Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      await updatePricingRule({
        ruleId: rule._id,
        isActive: !rule.isActive,
      });
      showToast.success(rule.isActive ? 'Discount deactivated' : 'Discount activated');
    } catch (error) {
      showToast.error('Failed to update discount');
    }
  };

  const handleDeleteRule = (rule: any) => {
    Alert.alert(
      'Delete Discount',
      'Are you sure you want to delete this discount rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePricingRule({ ruleId: rule._id });
              showToast.success('Discount deleted');
            } catch (error) {
              showToast.error('Failed to delete discount');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedClient(null);
    setDiscountPercentage('');
    setDescription('');
    setIsGlobalDiscount(false);
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'All Clients';
    const client = clients?.find((c: any) => c.clerkId === clientId);
    return client?.fullName || 'Unknown Client';
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 text-center" style={{ color: colors.text }}>
          Pricing & Discounts
        </Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} className="w-12 h-12 items-center justify-center">
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Info Card */}
        <View
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold mb-1" style={{ color: colors.text }}>
                Discount Management
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Set discounts for specific clients or apply a global discount to all clients. Client-specific discounts override global discounts.
              </Text>
            </View>
          </View>
        </View>

        {!pricingRules ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : pricingRules.length === 0 ? (
          <View
            className="rounded-xl p-8 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <Ionicons name="pricetag-outline" size={64} color={colors.textTertiary} />
            <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
              No discounts set
            </Text>
            <Text className="mt-2 text-sm text-center" style={{ color: colors.textSecondary }}>
              Create discounts for your clients
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="mt-6 rounded-xl py-3 px-6"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">Add Discount</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pricingRules.map((rule: any) => (
            <View
              key={rule._id}
              className="rounded-xl p-4 mb-4"
              style={{ 
                backgroundColor: colors.surface, 
                ...shadows.medium,
                opacity: rule.isActive ? 1 : 0.6,
              }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ionicons 
                      name={rule.clientId ? "person" : "people"} 
                      size={20} 
                      color={colors.primary} 
                    />
                    <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                      {getClientName(rule.clientId)}
                    </Text>
                  </View>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {rule.description}
                  </Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: rule.isActive ? `${colors.success}20` : `${colors.textTertiary}20` }}
                >
                  <Text className="text-xs font-semibold" style={{ color: rule.isActive ? colors.success : colors.textTertiary }}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Text className="text-4xl font-bold" style={{ color: colors.primary }}>
                  {rule.discountPercentage}%
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Discount
                </Text>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleToggleActive(rule)}
                  className="flex-1 rounded-lg py-2 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons 
                    name={rule.isActive ? "pause-circle-outline" : "play-circle-outline"} 
                    size={18} 
                    color={colors.text} 
                  />
                  <Text className="ml-2 font-semibold" style={{ color: colors.text }}>
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteRule(rule)}
                  className="rounded-lg py-2 px-4"
                  style={{ backgroundColor: `${colors.error}20` }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Discount Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.surface, maxHeight: '80%' }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Add Discount
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Discount Type */}
              <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>Discount Type</Text>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setIsGlobalDiscount(false)}
                  className="flex-1 rounded-xl p-4 flex-row items-center"
                  style={{ 
                    backgroundColor: !isGlobalDiscount ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: !isGlobalDiscount ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons name="person" size={20} color={!isGlobalDiscount ? '#FFF' : colors.text} />
                  <Text className="ml-2 font-semibold" style={{ color: !isGlobalDiscount ? '#FFF' : colors.text }}>
                    Specific Client
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsGlobalDiscount(true)}
                  className="flex-1 rounded-xl p-4 flex-row items-center"
                  style={{ 
                    backgroundColor: isGlobalDiscount ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: isGlobalDiscount ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons name="people" size={20} color={isGlobalDiscount ? '#FFF' : colors.text} />
                  <Text className="ml-2 font-semibold" style={{ color: isGlobalDiscount ? '#FFF' : colors.text }}>
                    All Clients
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Client Selection */}
              {!isGlobalDiscount && (
                <>
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Select Client</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                  >
                    {clients?.map((client: any) => (
                      <TouchableOpacity
                        key={client._id}
                        onPress={() => setSelectedClient(client)}
                        className="rounded-xl p-3 mr-2"
                        style={{ 
                          backgroundColor: selectedClient?.clerkId === client.clerkId ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: selectedClient?.clerkId === client.clerkId ? colors.primary : colors.border,
                        }}
                      >
                        <Text 
                          className="font-semibold" 
                          style={{ color: selectedClient?.clerkId === client.clerkId ? '#FFF' : colors.text }}
                        >
                          {client.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Discount Percentage</Text>
              <TextInput
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                placeholder="e.g., 10"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3 rounded-xl mb-4"
                style={{ backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border }}
              />

              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Description (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Loyalty discount"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                className="px-4 py-3 rounded-xl mb-6"
                style={{ backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' }}
              />

              <TouchableOpacity
                onPress={handleSaveDiscount}
                disabled={saving || (!isGlobalDiscount && !selectedClient)}
                className="rounded-xl py-4 items-center"
                style={{ 
                  backgroundColor: (!isGlobalDiscount && !selectedClient) || saving ? colors.border : colors.primary 
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">Create Discount</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
