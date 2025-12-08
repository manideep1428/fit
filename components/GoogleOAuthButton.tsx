import React, { useCallback, useEffect } from 'react'
import { TouchableOpacity, Text, ActivityIndicator, View, Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO, useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getColors, Shadows } from '@/constants/colors'
import { showToast } from '@/utils/toast'

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
    useEffect(() => {
        if (Platform.OS !== 'android') return
        void WebBrowser.warmUpAsync()
        return () => {
            // Cleanup: closes browser when component unmounts
            void WebBrowser.coolDownAsync()
        }
    }, [])
}

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession()

interface GoogleOAuthButtonProps {
    mode: 'signin' | 'signup'
    onError?: (error: string) => void
}

export default function GoogleOAuthButton({ mode, onError }: GoogleOAuthButtonProps) {
    useWarmUpBrowser()
    const router = useRouter()
    const scheme = useColorScheme()
    const colors = getColors(scheme === 'dark')
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light
    const [loading, setLoading] = React.useState(false)
    const { getToken, userId } = useAuth()
    const saveGoogleTokens = useMutation(api.users.saveGoogleTokens)

    // Use the `useSSO()` hook to access the `startSSOFlow()` method
    const { startSSOFlow } = useSSO()

    const onPress = useCallback(async () => {
        setLoading(true)
        try {
            const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl: AuthSession.makeRedirectUri(),
            })

            if (createdSessionId) {
                // Check if this was a sign-in (existing user) while in signup mode
                if (mode === 'signup' && signIn?.status === 'complete') {
                    showToast.success('Account already exists. Signing you in...')
                }

                await setActive!({ session: createdSessionId })

                // Wait a moment for session to be fully active
                await new Promise(resolve => setTimeout(resolve, 500))

                // Try to get and save Google Calendar token
                try {
                    const token = await getToken({ template: 'integration_google' })

                    if (token && userId) {
                        await saveGoogleTokens({
                            clerkId: userId,
                            accessToken: token,
                        })
                        console.log('Google Calendar tokens saved successfully')
                    }
                } catch (tokenError) {
                    console.error('Error saving Google tokens:', tokenError)
                }

                // Navigate based on user role and phone number
                const currentUser = (signIn as any)?.userData || (signUp as any)?.userData
                const userRole = currentUser?.unsafeMetadata?.role as string | undefined
                const hasPhoneNumber = currentUser?.unsafeMetadata?.phoneNumber

                if (userRole === 'trainer') {
                    router.replace('/(trainer)')
                } else if (userRole === 'client') {
                    router.replace('/(client)')
                } else if (!hasPhoneNumber) {
                    // New Google OAuth user without phone number
                    router.replace('/(auth)/phone-number')
                } else {
                    router.replace('/(auth)/role-selection')
                }
            } else {
                console.log('Missing requirements detected')
                if (signIn) {
                    console.log('SignIn status:', signIn.status)
                }
                if (signUp) {
                    console.log('SignUp status:', signUp.status)
                }
            }
        } catch (err: any) {
            console.error('Google OAuth Error:', JSON.stringify(err, null, 2))
            const errorMessage = err.errors?.[0]?.message || 'Google authentication failed'
            if (onError) {
                onError(errorMessage)
            } else {
                alert(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }, [startSSOFlow, router, onError, saveGoogleTokens, getToken, userId, mode])

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            className="py-4 rounded-xl flex-row items-center justify-center"
            style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
            }}
        >
            {loading ? (
                <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#DB4437" />
                    <Text className="text-lg font-medium ml-3" style={{ color: colors.text }}>
                        Connecting...
                    </Text>
                </View>
            ) : (
                <>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text className="text-lg font-medium ml-3" style={{ color: colors.text }}>
                        Sign with Google
                    </Text>
                </>
            )}
        </TouchableOpacity>
    )
}
