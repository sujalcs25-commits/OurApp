import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignupStep1Screen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please complete all fields');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    navigation.navigate('SignupStep2', {
      account: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Settings Button - Top Right */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Settings')}
        className="absolute top-4 right-4 z-20 bg-white/20 rounded-full p-3"
        accessibilityLabel="API Settings"
      >
        <MaterialIcons name="settings" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Hero Banner */}
      <View className="h-[40%] w-full justify-center items-center px-6 relative overflow-hidden">
        <View className="absolute inset-0 bg-primary" />
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1000' }}
          className="absolute inset-0 opacity-20 object-cover w-full h-full grayscale"
        />
        <View className="absolute inset-x-0 bottom-0 h-32 bg-primary opacity-80" />
        
        <Animated.View entering={FadeInDown.duration(800).springify()} className="z-10 items-center space-y-2 mt-8">
          <View className="p-3 rounded-full bg-surface-container-low mb-4 shadow-sm">
            <MaterialIcons name="directions-car" size={32} color="#0040a1" />
          </View>
          <Text className="text-4xl font-extrabold tracking-tight text-on-primary">DriveCare</Text>
          <Text className="text-primary-fixed-dim text-lg tracking-wide font-medium">Smart care for your vehicle</Text>
        </Animated.View>
      </View>

      {/* Form Card */}
      <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} className="flex-1 bg-surface rounded-t-[48px] -mt-12 px-8 pt-10 pb-10 shadow-sm">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="mb-8">
            <Text className="font-extrabold text-2xl text-on-surface">Create your account</Text>
            <Text className="text-on-surface-variant text-sm mt-2 leading-5">Join the community of precision vehicle owners.</Text>
          </View>

          <View className="space-y-4 mb-2">
            <Input 
              label="Full Name"
              icon="person"
              placeholder="Alex"
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
            />
            <Input 
              label="Email Address"
              icon="email"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
            />
            <Input 
              label="Password"
              icon="lock"
              placeholder="********"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              error={error} // Display error only on the last field
            />
          </View>

          <View className="mt-4">
            <Button 
              title="Continue" 
              icon="arrow-forward"
              onPress={handleContinue} 
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} className="mt-8 items-center flex-row justify-center">
            <Text className="text-on-surface-variant text-sm font-medium">Already have an account? </Text>
            <Text className="text-primary font-extrabold text-sm p-2 -m-2">Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#0040a1' } });
