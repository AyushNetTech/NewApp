import React, { useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Provider as PaperProvider } from 'react-native-paper'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import { Session } from '@supabase/supabase-js'

type RootStackParamList = {
Auth: undefined
Home: undefined
ResetPassword: { url?: string } | undefined
}

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

const Stack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
prefixes: ['myapp://'],
config: {
screens: {
ResetPassword: 'reset-password',
},
},
}

export default function App() {
const [session, setSession] = useState<Session | null>(null)

useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => {
Alert.alert('Initial session', session ? 'Logged in' : 'No session')
setSession(session)
})


const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  Alert.alert('Auth state changed', session ? 'Logged in' : 'Logged out')
  setSession(session)
})

return () => listener.subscription.unsubscribe()


}, [])

useEffect(() => {
const handleDeepLink = (event: { url: string }) => {
const url = event.url
Alert.alert('Deep link received', url)

  if (navigationRef.isReady()) {
    // Directly pass full URL to ResetPasswordScreen
    navigationRef.navigate('ResetPassword', { url })
  } else {
    Alert.alert('Navigation not ready', 'Cannot navigate yet')
  }
}

const subscription = Linking.addEventListener('url', handleDeepLink)

// Handle initial URL
Linking.getInitialURL().then((url) => {
  if (url) {
    Alert.alert('Initial URL', url)
    if (navigationRef.isReady()) {
      navigationRef.navigate('ResetPassword', { url })
    }
  }
})

return () => subscription.remove()


}, [])

return ( <PaperProvider>
<NavigationContainer linking={linking} ref={navigationRef} fallback={<></>}>
<Stack.Navigator screenOptions={{ headerShown: false }}>
{session ? (
<Stack.Screen name="Home" component={HomeScreen} />
) : (
<Stack.Screen name="Auth" component={AuthScreen} />
)}
<Stack.Screen
name="ResetPassword"
component={ResetPasswordScreen}
options={{ presentation: 'modal' }}
/>
</Stack.Navigator> </NavigationContainer> </PaperProvider>
)
}
