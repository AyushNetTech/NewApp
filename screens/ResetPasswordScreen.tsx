import React, { useState, useEffect } from 'react'
import { View, TextInput, Alert, StyleSheet, Button, Text, Linking } from 'react-native'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false) // To control initial render

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url
      if (!url) return

      try {
        const token = new URL(url).searchParams.get('access_token')
        if (token) {
          setAccessToken(token)
          setReady(true)
        }
      } catch (err) {
        console.warn('Invalid URL received:', url)
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink)

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (!url) return
      try {
        const token = new URL(url).searchParams.get('access_token')
        if (token) {
          setAccessToken(token)
          setReady(true)
        }
      } catch (err) {
        console.warn('Invalid initial URL:', url)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const updatePassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Enter a new password')
      return
    }
    if (!accessToken) {
      Alert.alert('Error', 'No reset token found in URL')
      return
    }

    setLoading(true)

    // 1️⃣ Set the session with the token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    })

    if (sessionError) {
      Alert.alert('Error', sessionError.message)
      setLoading(false)
      return
    }

    // 2️⃣ Update the password
    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Password updated! You can now log in.')
      navigation.navigate('Auth')
    }
  }

  // ✅ Show a friendly message until a valid token is received
  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>
          Waiting for password reset link...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={loading ? "Updating..." : "Update Password"}
        onPress={updatePassword}
        disabled={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 6 },
  waitingText: { textAlign: 'center', fontSize: 16, color: '#555' },
})
