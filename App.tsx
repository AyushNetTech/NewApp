import React, { useEffect, useState } from 'react'
import { NavigationContainer, LinkingOptions } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Provider as PaperProvider } from 'react-native-paper'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import { Session } from '@supabase/supabase-js'

const Stack = createNativeStackNavigator()

type RootStackParamList = {
  Auth: undefined
  Home: undefined
  ResetPassword: { url?: string } | undefined
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
  // Only parse links that match your screens
  async getInitialURL() {
    const url = await supabase.auth.getSession() // Optional if needed
    return null
  },
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <PaperProvider>
      <NavigationContainer linking={linking} fallback={<></>}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {/* Normal screens depending on session */}
          {session ? (
            <Stack.Screen name="Home" component={HomeScreen} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}

          {/* ResetPasswordScreen is only pushed when a deep link matches */}
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ presentation: 'modal' }} // Optional: modal presentation
          />

        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  )
}
