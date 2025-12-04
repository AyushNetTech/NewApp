import React, { useEffect, useState } from 'react'
import { Alert, Linking, ActivityIndicator, View } from 'react-native'
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Provider as PaperProvider } from 'react-native-paper'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import ProfileSetupScreen from './screens/ProfileSetupScreen'
import { Session } from '@supabase/supabase-js'

export type RootStackParamList = {
  Auth: undefined
  Home: undefined
  ResetPassword: { url?: string } | undefined
  ProfileSetup: undefined
}

export const navigationRef = createNavigationContainerRef<RootStackParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      ProfileSetup: 'profile-setup',
    },
  },
};


export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load session
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
     
      setSession(session)
      setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
       
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleAuthCallback = async (url: string) => {
  const [, hash] = url.split('#');
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.log('Error setting session:', error.message);
      return;
    }

    console.log('Signed in successfully', data.session);
    setSession(data.session);
    setLoading(false); // important for navigator to render HomeScreen
  }
};


  // Handle deep links
 useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;
    if (url.startsWith("myapp://reset-password")) {
      navigationRef.isReady() && navigationRef.navigate("ResetPassword", { url });
      return;
    }
    if (url.startsWith("myapp://auth/callback")) {
      handleAuthCallback(url); // parse tokens and set session
      return;
    }
  };

  const subscription = Linking.addEventListener("url", handleDeepLink);

  // Cold start
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });

  return () => subscription.remove();
}, []);


  // Check profile if user logged in
  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profile && navigationRef.isReady()) {

        navigationRef.reset({
          index: 0,
          routes: [{ name: 'ProfileSetup' }],
        })
      }
    }
    checkProfile()
  }, [session])

  return (
    <PaperProvider>
      <NavigationContainer linking={linking} ref={navigationRef} fallback={<></>}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
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
        )}
      </NavigationContainer>
    </PaperProvider>
  )
}
