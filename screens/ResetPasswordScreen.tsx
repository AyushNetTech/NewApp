import React, { useState, useEffect } from 'react'
import { View, TextInput, Alert, StyleSheet, Button, Text, Linking, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const parseTokensFromUrl = (url: string | null) => {
    if (!url) return { accessToken: null, refreshToken: null }
    try {
      const params = new URL(url).searchParams
      let access = params.get('access_token')
      let refresh = params.get('refresh_token')

      if ((!access || !refresh) && url.includes('#')) {
        const hash = url.split('#')[1]
        const hashParams = new URLSearchParams(hash)
        access = access || hashParams.get('access_token')
        refresh = refresh || hashParams.get('refresh_token')
      }

      
      return { accessToken: access, refreshToken: refresh }
    } catch (err: any) {
      
      return { accessToken: null, refreshToken: null }
    }
  }

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      
      const { accessToken, refreshToken } = parseTokensFromUrl(url)
      if (accessToken && refreshToken) {
        setAccessToken(accessToken)
        setRefreshToken(refreshToken)
        setReady(true)
        
      }
    }

    const paramUrl = route.params?.url
    if (paramUrl) {
      handleUrl(paramUrl)
      return
    }

    Linking.getInitialURL().then(url => handleUrl(url))
    const sub = Linking.addEventListener('url', e => handleUrl(e.url))
    return () => sub.remove()
  }, [route.params])

  const updatePassword = async () => {
    if (!password) return Alert.alert('Error', 'Enter a new password')
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters')
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match')
    if (!accessToken || !refreshToken) return Alert.alert('Error', 'Missing access or refresh token')

    setLoading(true)
    

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      setLoading(false)
      return Alert.alert('Error', sessionError.message)
    }

   

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) return Alert.alert('Error', updateError.message)

    

    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Waiting for password reset link...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {password.length > 0 && password.length < 6 && (
        <Text style={styles.validationText}>Password must be at least 6 characters</Text>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {confirmPassword.length > 0 && confirmPassword !== password && (
        <Text style={styles.validationText}>Passwords do not match</Text>
      )}

      <Button title={loading ? 'Updating...' : 'Update Password'} onPress={updatePassword} disabled={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  inputWrapper: { position: 'relative', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, paddingRight: 40, borderRadius: 6 },
  eyeIcon: { position: 'absolute', right: 10, top: 14 },
  validationText: { color: 'red', marginBottom: 10, fontSize: 13 },
  waitingText: { textAlign: 'center', fontSize: 16, color: '#555' },
})
