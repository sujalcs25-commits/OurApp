import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignupStep2Screen({ navigation, route }) {
  const account = route.params?.account;
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [error, setError] = useState('');

  const continueToReview = (shouldSkipVehicle = false) => {
    if (!account) {
      navigation.replace('SignupStep1');
      return;
    }

    if (!shouldSkipVehicle && (!make.trim() || !model.trim())) {
      setError('Vehicle make and model are required, or you can skip this step');
      return;
    }

    setError('');
    navigation.navigate('SignupStep3', {
      account,
      vehicle: shouldSkipVehicle
        ? null
        : {
            make: make.trim(),
            model: model.trim(),
            year: year.trim(),
            licensePlate: licensePlate.trim(),
          },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View className="flex-row items-center px-6 py-4 bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
        </TouchableOpacity>
        <Text className="ml-4 font-extrabold text-lg text-on-surface">Add First Vehicle</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center border-4 border-white shadow-sm mb-4">
            <MaterialIcons name="directions-car" size={48} color="#0040a1" />
          </View>
          <Text className="text-2xl font-extrabold text-on-surface">What do you drive?</Text>
          <Text className="text-sm text-on-surface-variant text-center mt-3 px-4 leading-5 font-medium">Add your primary vehicle to start tracking maintenance and fuel right away.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} className="space-y-4 mb-2">
          <Input 
            label="Make"
            placeholder="e.g. Tesla"
            value={make}
            onChangeText={(v) => { setMake(v); setError(''); }}
          />
          <Input 
            label="Model"
            placeholder="e.g. Model 3"
            value={model}
            onChangeText={(v) => { setModel(v); setError(''); }}
          />
          <View className="flex-row space-x-4">
            <View className="flex-1 mr-2">
              <Input 
                label="Year"
                placeholder="2023"
                keyboardType="numeric"
                value={year}
                onChangeText={(v) => { setYear(v); setError(''); }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Input 
                label="License Plate"
                placeholder="ABC 123"
                autoCapitalize="characters"
                value={licensePlate}
                onChangeText={(v) => { setLicensePlate(v); setError(''); }}
              />
            </View>
          </View>
          
          {error ? (
            <Animated.View entering={FadeIn} className="mt-2 mb-2">
              <Text className="text-error text-xs font-medium ml-1">{error}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} className="mt-6 mb-8">
          <Button 
            title="Continue"
            icon="arrow-forward"
            onPress={() => continueToReview(false)}
            className="mb-6"
          />

          <TouchableOpacity onPress={() => continueToReview(true)} className="items-center py-4 rounded-xl border-2 border-outline-variant/30">
            <Text className="text-on-surface-variant font-bold text-sm">Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f9f9ff' } });
