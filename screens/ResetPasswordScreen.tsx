import React, { useState, useEffect } from 'react'
import { View, TextInput, Alert, StyleSheet, Button, Text, Linking } from 'react-native'
import { supabase } from '../lib/supabase'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function ResetPasswordScreen() {
const navigation = useNavigation<any>()
const route = useRoute<any>()

const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)
const [accessToken, setAccessToken] = useState<string | null>(null)
const [refreshToken, setRefreshToken] = useState<string | null>(null)
const [ready, setReady] = useState(false)

// Helper to parse access_token and refresh_token from URL
const parseTokensFromUrl = (url: string | null): { accessToken: string | null, refreshToken: string | null } => {
if (!url) return { accessToken: null, refreshToken: null }


try {  
  // Query param style ?access_token=...&refresh_token=...  
  const queryParams = new URL(url).searchParams  
  let access = queryParams.get('access_token')  
  let refresh = queryParams.get('refresh_token')  

  // Hash style #access_token=...&refresh_token=...  
  if ((!access || !refresh) && url.includes('#')) {  
    const hash = url.split('#')[1]  
    const hashParams = new URLSearchParams(hash)  
    access = access || hashParams.get('access_token')  
    refresh = refresh || hashParams.get('refresh_token')  
  }  

  return { accessToken: access, refreshToken: refresh }  
} catch (err) {  
  Alert.alert('parseTokensFromUrl error', String(err))  
  return { accessToken: null, refreshToken: null }  
} 


}

useEffect(() => {
const handleUrl = (url: string | null) => {
Alert.alert('Handling URL', url ?? 'null')
const { accessToken, refreshToken } = parseTokensFromUrl(url)
Alert.alert('Parsed Tokens', `access: ${accessToken ?? 'null'}\nrefresh: ${refreshToken ?? 'null'}`)
if (accessToken && refreshToken) {
setAccessToken(accessToken)
setRefreshToken(refreshToken)
setReady(true)
}
}


// 1️⃣ Check route param first  
const paramUrl: string | undefined = route.params?.url  
if (paramUrl) {  
  Alert.alert('URL from route.params', paramUrl)  
  handleUrl(paramUrl)  
  return  
}  

// 2️⃣ Check initial URL  
Linking.getInitialURL().then(url => {  
  Alert.alert('Initial URL', url ?? 'null')  
  handleUrl(url)  
}).catch(err => {  
  Alert.alert('getInitialURL error', String(err))  
})  

// 3️⃣ Listen for URL events while mounted  
const sub = Linking.addEventListener('url', event => handleUrl(event.url))  
return () => sub.remove()  


}, [route.params])

const updatePassword = async () => {
if (!password) {
Alert.alert('Error', 'Enter a new password')
return
}
if (!accessToken || !refreshToken) {
Alert.alert('Error', 'Missing access or refresh token')
return
}


setLoading(true)  
Alert.alert('Step 1', `Setting session with tokens:\naccess: ${accessToken}\nrefresh: ${refreshToken}`)  

// 1️⃣ Set session with both access and refresh tokens  
const { error: sessionError } = await supabase.auth.setSession({  
  access_token: accessToken,  
  refresh_token: refreshToken,  
})  

if (sessionError) {  
  Alert.alert('Set session error', sessionError.message)  
  setLoading(false)  
  return  
}  

Alert.alert('Step 2', 'Session set successfully')  

// 2️⃣ Update password  
const { error: updateError } = await supabase.auth.updateUser({ password })  
setLoading(false)  

if (updateError) {  
  Alert.alert('Update password error', updateError.message)  
} else {  
  Alert.alert('Success', 'Password updated! Please login with your new password.')  
  navigation.navigate('Auth')  
}  


}

if (!ready) {
return ( <View style={styles.container}> <Text style={styles.waitingText}>Waiting for password reset link...</Text> </View>
)
}

return ( <View style={styles.container}> <TextInput  
     style={styles.input}  
     placeholder="New Password"  
     secureTextEntry  
     value={password}  
     onChangeText={setPassword}  
   />
<Button title={loading ? 'Updating...' : 'Update Password'} onPress={updatePassword} disabled={loading} /> </View>
)
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', padding: 20 },
input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 6 },
waitingText: { textAlign: 'center', fontSize: 16, color: '#555' },
})
