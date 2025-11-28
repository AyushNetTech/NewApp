import React, { useEffect, useState } from 'react'
import { Alert, Linking, ActivityIndicator, View } from 'react-native'
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Provider as PaperProvider } from 'react-native-paper'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import { Session } from '@supabase/supabase-js'
import ProfileSetupScreen from './screens/ProfileSetupScreen';


type RootStackParamList = {
  Auth: undefined
  Home: undefined
  ResetPassword: { url?: string } | undefined
  ProfileSetup: undefined   // ✅ NEW
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
  const [loading, setLoading] = useState(true) // 👈 NEW

  // Load session FIRST (before showing screens)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false) // 👈 Only now UI should render
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url

      if (navigationRef.isReady()) {
        navigationRef.navigate('ResetPassword', { url })
      } else {
        Alert.alert('Navigation not ready', 'Cannot navigate yet')
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink)

    
    Linking.getInitialURL().then((url) => {
  if (!url || !navigationRef.isReady()) return;

  if (url.startsWith("myapp://reset-password")) {
    navigationRef.navigate("ResetPassword", { url });
  }

  if (url.startsWith("myapp://profile-setup")) {
    navigationRef.navigate("ProfileSetup");
  }
});


    

    return () => subscription.remove()
  }, [])

  // 💥 Show loading screen until session is restored
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
  setSession(session);

  if (event === "SIGNED_IN" && session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile) {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: "ProfileSetup" }],
        });
      }
    }
  }
});


  return (
    <PaperProvider>
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

          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  )
}
