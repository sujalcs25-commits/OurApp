import React, { useState } from 'react';
import {
  View, Text, Image,
  StyleSheet, ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DEMO_EMAIL    = 'demo@drivecare.com';
const DEMO_PASSWORD = 'Demo1234';

const GoogleIcon = () => (
  <Text className="font-extrabold text-[#4285F4] text-lg mr-2">G</Text>
);

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ─── Core login logic ───────────────────────────────────────────────────────
  const completeLogin = async (loginEmail, loginPassword) => {
    setError('');

    if (!loginEmail?.trim() || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(loginEmail.trim().toLowerCase(), loginPassword);
      await login(data.token, data.user);
    } catch (err) {
      console.error('[Login Error]', err);
      
      // Check if it's a network error
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Tap the Settings icon (⚙️) above to configure your backend URL, or check if your backend server is running.');
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection and backend server status.');
      } else {
        const message =
          err.response?.data?.msg ||
          err.message ||
          'Unable to sign in right now. Please try again.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin    = () => completeLogin(email, password);
  const handleUseDemo  = () => completeLogin(DEMO_EMAIL, DEMO_PASSWORD);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Settings Button - Top Right */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          className="absolute top-4 right-4 z-20 bg-white/20 rounded-full p-3"
          accessibilityLabel="API Settings"
        >
          <MaterialIcons name="settings" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Hero banner */}
        <View className="w-full justify-end items-center pb-12 px-8 overflow-hidden relative min-h-[340px]">
          <View className="absolute inset-0 bg-primary" />
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1000' }}
            className="absolute inset-0 opacity-20 object-cover w-full h-full"
          />
          {/* Gradient overlay using generic views since Expo LinearGradient needs installing */}
          <View className="absolute inset-x-0 bottom-0 h-32 bg-primary opacity-80" />
          
          <Animated.View entering={FadeInDown.duration(800).springify()} className="absolute top-12 left-8 z-10 flex-row items-center">
            <MaterialIcons name="directions-car" size={28} color="#ffffff" className="mr-2" />
            <Text className="text-2xl font-extrabold tracking-tight text-on-primary">DriveCare</Text>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="z-10 items-center space-y-3 mt-24">
            <Text className="text-4xl font-extrabold text-on-primary text-center leading-tight">
              Vehicle care, simplified.
            </Text>
            <Text className="text-primary-fixed-dim text-sm font-medium opacity-90 text-center mt-3 px-4 leading-6">
              Track fuel, service reminders, documents, and health from one clean dashboard.
            </Text>
          </Animated.View>
        </View>

        {/* Form card */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(800).springify()} 
          className="bg-surface rounded-t-[40px] -mt-10 px-8 pt-10 pb-12 shadow-sm"
        >
          {/* Demo banner */}
          <View className="bg-secondary-container rounded-2xl p-5 mb-8 border border-secondary-fixed shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-primary font-extrabold text-base mb-1">Try the demo account</Text>
                <Text className="text-on-secondary-container text-xs leading-5">
                  Preview the app instantly with sample vehicle data.
                </Text>
              </View>
              <Button 
                title="Use Demo" 
                onPress={handleUseDemo} 
                disabled={loading} 
                className="w-[110px] h-[44px] rounded-lg"
                textClassName="text-on-primary font-bold text-xs uppercase"
              />
            </View>
          </View>

          {/* Form Fields */}
          <View className="mb-2">
            <Input
              label="Email Address"
              icon="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              returnKeyType="next"
            />
            
            <Input
              label="Password"
              icon="lock"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={error} // Only pass error to the last field to avoid duplicate messages
            />
          </View>

          {/* Forgot password */}
          <View className="items-end mb-8 mt-1">
            <TouchableOpacity accessibilityLabel="Forgot password">
              <Text className="text-xs font-bold text-primary uppercase tracking-widest">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <Button 
            title="Sign In" 
            icon="login"
            onPress={handleLogin} 
            loading={loading}
          />

          {/* Google */}
          <View className="mt-4">
            <Button 
              title="Continue with Google" 
              variant="secondary"
              icon=""
              onPress={() => {}}
            />
            {/* Position Google Icon absolute since Button doesn't support custom element icons easily right now */}
            <View className="absolute left-[20%] top-0 bottom-0 justify-center">
               <GoogleIcon />
            </View>
          </View>

          {/* Sign up link */}
          <View className="mt-10 items-center flex-row justify-center">
            <Text className="text-on-surface-variant text-sm font-medium">New to DriveCare? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignupStep1')} className="p-2 -m-2">
              <Text className="text-primary font-extrabold text-sm">Create Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0040a1' },
  scrollContent: { flexGrow: 1, backgroundColor: '#0040a1' },
});
