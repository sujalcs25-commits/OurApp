import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { fetchVehicles, fetchEcoSummary } from '../services/api';

const SkeletonView = ({ className }) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[animatedStyle]} className={`bg-surface-dim ${className}`} />;
};

const QuickActionItem = ({ icon, label, onPress, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()}>
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7} 
      className="bg-surface rounded-2xl p-4 shadow-sm items-center justify-center mr-3 w-[100px] border border-outline-variant/30"
    >
      <View className="w-12 h-12 rounded-full bg-primary-fixed items-center justify-center mb-2">
        <MaterialIcons name={icon} size={24} color="#0040a1" />
      </View>
      <Text className="font-bold text-on-surface text-xs text-center">{label}</Text>
    </TouchableOpacity>
  </Animated.View>
);

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [userName, setUserName] = useState('Driver');
  const [error, setError] = useState('');
  const [ecoSummary, setEcoSummary] = useState(null);
  
  const tabBarHeight = useBottomTabBarHeight();

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!refreshing) setLoading(true);

      const [vehicleData, storedUser] = await Promise.all([
        fetchVehicles(),
        AsyncStorage.getItem('user'),
      ]);

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.name) setUserName(parsedUser.name);
        } catch { /* malformed storage — ignore */ }
      }

      setVehicles(vehicleData);

      // Find primary vehicle or use first one
      const primaryVehicle = vehicleData.find(v => v.isPrimary) || vehicleData[0];

      if (primaryVehicle) {
        try {
          const eco = await fetchEcoSummary(primaryVehicle.id || primaryVehicle._id);
          setEcoSummary(eco);
        } catch { /* eco summary is non-critical */ }
      } else {
        setEcoSummary(null);
      }
      setError('');
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to load your garage right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Refresh eco widget whenever the Home tab comes back into focus
  useFocusEffect(
    useCallback(() => {
      const refreshEco = async () => {
        try {
          const vehicleData = await fetchVehicles();
          setVehicles(vehicleData);
          
          // Find primary vehicle or use first one
          const primaryVehicle = vehicleData.find(v => v.isPrimary) || vehicleData[0];
          
          if (primaryVehicle) {
            const eco = await fetchEcoSummary(primaryVehicle.id || primaryVehicle._id);
            setEcoSummary(eco);
          }
        } catch { /* silent */ }
      };
      refreshEco();
    }, [])
  );

  const renderSkeleton = () => (
    <View className="px-6 py-4 flex-col gap-6">
      <View className="bg-surface-container-low rounded-xl p-6 shadow-sm">
        <View className="flex-row items-center gap-3">
          <SkeletonView className="w-12 h-12 rounded-full" />
          <View>
            <SkeletonView className="w-32 h-6 rounded-md mb-2" />
            <SkeletonView className="w-24 h-4 rounded-md" />
          </View>
        </View>
        <View className="mt-8 flex-row gap-4 justify-between">
          <SkeletonView className="flex-1 h-16 rounded-lg" />
          <SkeletonView className="flex-1 h-16 rounded-lg" />
          <SkeletonView className="flex-1 h-16 rounded-lg" />
        </View>
      </View>
    </View>
  );

  const primaryVehicle = vehicles.find(v => v.isPrimary) || vehicles[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-background">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100' }}
            className="w-11 h-11 rounded-full bg-outline-variant"
          />
          <View>
            <Text className="text-sm font-medium text-on-surface-variant">Welcome back,</Text>
            <Text className="text-xl font-extrabold tracking-tight text-on-surface">{userName.split(' ')[0]}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')} 
          className="w-11 h-11 rounded-full bg-surface-container-high items-center justify-center border border-outline-variant/20"
        >
          <MaterialIcons name="settings" size={22} color="#0040a1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(tabBarHeight + 20, 110) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0040a1" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          renderSkeleton()
        ) : (
          <View className="px-6 py-2 flex-col gap-8">
            
            {/* Error Message */}
            {error ? (
              <Animated.View entering={FadeIn.duration(300)} className="bg-error-container rounded-2xl p-4 border border-error/20 mb-4">
                <Text className="text-on-error-container font-bold mb-2">We hit a loading issue</Text>
                <Text className="text-on-error-container text-sm mb-3">{error}</Text>
                <TouchableOpacity onPress={() => loadData(true)} className="self-start bg-error px-4 py-2 rounded-xl">
                  <Text className="text-on-error font-bold text-xs uppercase tracking-wide">Try Again</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            {/* Empty State */}
            {!loading && vehicles.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-surface-container-low rounded-3xl p-8 shadow-sm items-center text-center mt-4 border border-outline-variant/30">
                <View className="w-20 h-20 rounded-full bg-primary-fixed items-center justify-center mb-6">
                  <MaterialIcons name="directions-car" size={40} color="#0040a1" />
                </View>
                <Text className="font-extrabold text-2xl text-on-surface mb-3 text-center">Your garage is empty</Text>
                <Text className="text-sm text-on-surface-variant leading-6 text-center mb-8">
                  Add your first vehicle to unlock fuel tracking, service reminders, and health insights.
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('MyVehicles')} 
                  className="bg-primary w-full py-4 rounded-xl items-center shadow-md shadow-primary/30"
                >
                  <Text className="text-on-primary font-bold text-lg">Add a Vehicle</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <>
                {/* Primary Vehicle Card (Redesigned) */}
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="font-extrabold text-xl text-on-surface">Primary Vehicle</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MyVehicles')} className="px-2 py-1">
                      <Text className="text-primary font-bold text-sm">View Garage</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="bg-primary rounded-[32px] p-6 relative overflow-hidden shadow-lg shadow-primary/20">
                    {/* Decorative background circle */}
                    <View className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-5 rounded-full" />
                    
                    <View className="flex-row justify-between items-start z-10">
                      <View className="flex-row items-center gap-3 flex-1 pr-4">
                        <View className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                          <MaterialIcons name="directions-car" size={28} color="#ffffff" />
                        </View>
                        <View className="flex-1">
                          <Text className="font-extrabold text-2xl text-on-primary">{primaryVehicle.make} {primaryVehicle.model}</Text>
                          <Text className="text-sm text-primary-fixed-dim mt-1 font-medium">{primaryVehicle.licensePlate}</Text>
                        </View>
                      </View>
                      <View className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 backdrop-blur-md">
                        <MaterialIcons name="check-circle" size={14} color="#63f7ff" />
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-[#63f7ff]">{primaryVehicle.healthStatus}</Text>
                      </View>
                    </View>

                    <View className="mt-8 z-10 flex-row justify-between">
                      <View className="bg-white/10 rounded-2xl p-3 flex-1 mr-2 items-center backdrop-blur-md border border-white/10">
                        <MaterialIcons name="battery-charging-full" size={20} color="#b2c5ff" className="mb-1" />
                        <Text className="font-extrabold text-lg text-white">{primaryVehicle.battery}%</Text>
                        <Text className="text-[10px] text-primary-fixed-dim uppercase font-bold tracking-widest mt-1">Battery</Text>
                      </View>
                      <View className="bg-white/10 rounded-2xl p-3 flex-1 mx-2 items-center backdrop-blur-md border border-white/10">
                        <MaterialIcons name="speed" size={20} color="#b2c5ff" className="mb-1" />
                        <Text className="font-extrabold text-lg text-white">{primaryVehicle.range}</Text>
                        <Text className="text-[10px] text-primary-fixed-dim uppercase font-bold tracking-widest mt-1">Km Range</Text>
                      </View>
                      <View className="bg-white/10 rounded-2xl p-3 flex-1 ml-2 items-center backdrop-blur-md border border-white/10">
                        <MaterialIcons name="tire-repair" size={20} color="#b2c5ff" className="mb-1" />
                        <Text className="font-extrabold text-lg text-[#63f7ff]">{primaryVehicle.tirePressure}</Text>
                        <Text className="text-[10px] text-primary-fixed-dim uppercase font-bold tracking-widest mt-1">Tires</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                {/* Quick Actions (Horizontal Scroll) */}
                <View>
                  <Text className="font-extrabold text-lg text-on-surface mb-3">Quick Actions</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible pb-2 -mx-6 px-6">
                    <QuickActionItem icon="local-gas-station" label="Log Fuel" delay={100} onPress={() => navigation.navigate('Fuel')} />
                    <QuickActionItem icon="build" label="Service" delay={200} onPress={() => navigation.navigate('Service')} />
                    <QuickActionItem icon="folder" label="Documents" delay={300} onPress={() => navigation.navigate('Documents')} />
                    <QuickActionItem icon="sos" label="SOS Help" delay={400} onPress={() => navigation.navigate('SOS')} />
                  </ScrollView>
                </View>

                {/* Upcoming Service Card */}
                <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} className="bg-surface-container rounded-3xl p-6 shadow-sm border border-outline-variant/20">
                  <View className="flex-row items-center gap-3 mb-6">
                    <View className="bg-primary/10 p-2 rounded-xl">
                      <MaterialIcons name="car-repair" size={24} color="#0040a1" />
                    </View>
                    <Text className="font-extrabold text-xl text-on-surface">Upcoming Service</Text>
                  </View>
                  
                  <View className="bg-surface rounded-2xl p-5 flex-row items-center justify-between mb-5 shadow-sm border border-outline-variant/10">
                    <View className="flex-1 pr-4">
                      <Text className="font-bold text-lg text-on-surface">Oil Change</Text>
                      <Text className="text-sm text-on-surface-variant mt-1 font-medium">Due in 800 km</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Service')} 
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30"
                    >
                      <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="w-full bg-outline-variant/30 rounded-full h-3 overflow-hidden">
                    <View className="bg-primary h-3 rounded-full w-[80%]" />
                  </View>
                  <View className="flex-row justify-between mt-3">
                    <Text className="text-xs text-on-surface-variant font-bold">Last: 19,000 km</Text>
                    <Text className="text-xs text-on-surface-variant font-bold">Next: 19,800 km</Text>
                  </View>
                </Animated.View>

                {/* Eco Impact Widget */}
                <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Eco')}
                    activeOpacity={0.85}
                    className="rounded-3xl p-6 shadow-sm border border-[#1a6b2f]/10"
                    style={{ backgroundColor: '#f0fdf4' }} // Light green tailwind bg
                  >
                    <View className="flex-row items-center justify-between mb-5">
                      <View className="flex-row items-center gap-3">
                        <View className="bg-[#1a6b2f]/10 p-2 rounded-xl">
                          <MaterialIcons name="eco" size={24} color="#1a6b2f" />
                        </View>
                        <Text className="font-extrabold text-xl" style={{ color: '#1a6b2f' }}>Eco Impact</Text>
                      </View>
                      {ecoSummary?.badge && (
                        <View style={{ backgroundColor: ecoSummary.badge.color + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: ecoSummary.badge.color + '44' }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: ecoSummary.badge.color, textTransform: 'uppercase' }}>{ecoSummary.badge.label}</Text>
                        </View>
                      )}
                    </View>

                    {ecoSummary && ecoSummary.totals.totalCo2Saved > 0 ? (
                      <>
                        <View className="flex-row justify-between mb-5 bg-white/50 rounded-2xl p-4">
                          <View className="items-center flex-1">
                            <Text className="font-extrabold text-2xl" style={{ color: '#1a6b2f' }}>{ecoSummary.totals.totalCo2Saved}</Text>
                            <Text className="text-[10px] font-bold text-center uppercase tracking-widest mt-1" style={{ color: '#2e4a2e' }}>kg CO₂ saved</Text>
                          </View>
                          <View className="w-[1px] bg-[#1a6b2f]/10 h-full mx-2" />
                          <View className="items-center flex-1">
                            <Text className="font-extrabold text-2xl" style={{ color: '#1a6b2f' }}>{ecoSummary.totals.totalTrees}</Text>
                            <Text className="text-[10px] font-bold text-center uppercase tracking-widest mt-1" style={{ color: '#2e4a2e' }}>Trees/yr</Text>
                          </View>
                          <View className="w-[1px] bg-[#1a6b2f]/10 h-full mx-2" />
                          <View className="items-center flex-1">
                            <Text className="font-extrabold text-2xl" style={{ color: '#1a6b2f' }}>{ecoSummary.ecoScore}</Text>
                            <Text className="text-[10px] font-bold text-center uppercase tracking-widest mt-1" style={{ color: '#2e4a2e' }}>Score</Text>
                          </View>
                        </View>
                        {/* Eco score bar */}
                        <View style={{ height: 6, backgroundColor: '#c8e6c9', borderRadius: 6, overflow: 'hidden' }}>
                          <View style={{ height: 6, borderRadius: 6, backgroundColor: '#1a6b2f', width: `${Math.min(100, ecoSummary.ecoScore)}%` }} />
                        </View>
                      </>
                    ) : (
                      <View className="bg-white/50 rounded-2xl p-4">
                        <Text className="text-sm font-medium leading-6" style={{ color: '#2e4a2e' }}>
                          🌱 Service your vehicle on time and log the eco impact to see how much CO₂ you're saving.
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-end mt-4 gap-1">
                      <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: '#1a6b2f' }}>View full report</Text>
                      <MaterialIcons name="chevron-right" size={18} color="#1a6b2f" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9ff',
  },
});
