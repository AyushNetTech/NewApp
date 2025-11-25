import React, { useState } from 'react'
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const navigation = useNavigation<any>()

  // -----------------------------
  // LOGIN
  // -----------------------------
  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  // -----------------------------
  // SIGN UP
  // -----------------------------
  async function signUp() {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      Alert.alert(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: { display_name: username, phone }
      })
      if (metaError) Alert.alert(metaError.message)
    }

    Alert.alert(
      'Success!',
      'Account created. Check your email to verify your account.'
    )
    setLoading(false)
  }

  // -----------------------------
  // RESET PASSWORD
  // -----------------------------
  async function resetPassword() {
  if (!email) {
    Alert.alert("Enter your email first");
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "myapp://reset-password",
  });

  setLoading(false);

  if (error) {
    Alert.alert(error.message);
  } else {
    Alert.alert(
      "Password Reset Email Sent",
      "Check your inbox and open the link using your device."
    );
  }
}


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isSignUp && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#2e86de' }]}
        onPress={isSignUp ? signUp : signIn}
        disabled={loading}
      >
        <Text style={styles.btnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      </TouchableOpacity>

      {!isSignUp && (
        <TouchableOpacity onPress={resetPassword}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switch}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, textAlign: 'center', marginBottom: 20, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, fontSize: 16, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 6, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  forgot: { textAlign: 'center', color: '#2e86de', marginTop: 10 },
  switch: { textAlign: 'center', color: '#10ac84', marginTop: 20, fontWeight: '600' },
})
