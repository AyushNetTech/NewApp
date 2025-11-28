import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  ResetPassword: { url?: string } | undefined;
  ProfileSetup: undefined;
};

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProfileSetup"
>;

export default function ProfileSetupScreen({ navigation }: { navigation: ProfileNavProp })

{

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  async function saveProfile() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const id = userData.user.id;

    const { error } = await supabase.from('profiles').upsert({
      id,
      first_name: firstName,
      last_name: lastName,
      username,
      phone,
      email: userData.user.email,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Profile created!");
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />

      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />

      <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <TouchableOpacity style={styles.btn} onPress={saveProfile}>
        <Text style={styles.btnText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, marginBottom: 20, fontWeight: '700', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, marginBottom: 12 },
  btn: { backgroundColor: '#2e86de', padding: 14, borderRadius: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
