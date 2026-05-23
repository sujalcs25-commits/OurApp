import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInDown } from 'react-native-reanimated';

import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function SignupStep3Screen({ navigation, route }) {
  const { login } = useAuth();
  const account = route.params?.account;
  const vehicle = route.params?.vehicle;
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!account) {
      navigation.replace('SignupStep1');
      return;
    }

    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 1000 });
  }, [account, navigation, opacity, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleCompleteSignup = async () => {
    if (!account) {
      navigation.replace('SignupStep1');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await registerUser({ ...account, vehicle });
      // login() persists token + user AND flips isAuthenticated
      // → AppNavigator automatically switches to AppStack
      await login(data.token, data.user);
    } catch (requestError) {
      console.error('[Signup Error]', requestError);
      
      // Check if it's a network error
      if (requestError.message === 'Network Error' || requestError.code === 'ERR_NETWORK' || !requestError.response) {
        setError('Cannot connect to server. Please go back and configure your backend URL in Settings (⚙️ icon on Login screen).');
      } else {
        const message = requestError.response?.data?.msg || 'Unable to create account right now.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-1 px-8 justify-center items-center">
        
        <Animated.View style={animatedIconStyle} className="w-32 h-32 rounded-full bg-primary-fixed flex items-center justify-center mb-8 shadow-lg border-4 border-white">
          <MaterialIcons name="done-all" size={64} color="#0040a1" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="items-center w-full">
          <Text className="text-3xl font-extrabold text-on-surface mb-4 text-center">Ready to create your garage?</Text>
          <Text className="text-base text-on-surface-variant font-medium text-center mb-8 px-4 leading-relaxed">
            We&apos;ll create your account and {vehicle ? 'save your first vehicle so you can start tracking right away.' : 'you can add your first vehicle later.'}
          </Text>

          {error ? <Text className="text-error text-sm font-medium text-center mb-6 px-4 bg-error-container/50 p-3 rounded-xl border border-error/20 w-full">{error}</Text> : null}

          <Button 
            title="Create Account"
            icon="check-circle"
            onPress={handleCompleteSignup}
            loading={loading}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f9f9ff' } });
