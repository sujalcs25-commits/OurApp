import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fetchVehicles } from '../services/api';

export default function VehicleHealthScreen() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchVehicles();
      if (data.length > 0) setSelectedVehicle(data[0]);
      else setSelectedVehicle(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getHealthScore = (status) => {
    if (status === 'Healthy') return 95;
    if (status === 'Warning') return 75;
    if (status === 'Critical') return 40;
    return 90;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-4 bg-background flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
            <MaterialIcons name="analytics" size={20} color="#0040a1" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold tracking-tight text-on-surface">Health Insights</Text>
        </View>
        <View className="bg-primary/10 py-1 px-3 rounded-full border border-primary/20">
            <Text className="text-primary text-xs font-bold">{selectedVehicle ? selectedVehicle.licensePlate : 'Garage'}</Text>
        </View>
      </View>

      <ScrollView 
         className="flex-1 px-6 pt-4" 
         contentContainerStyle={{ paddingBottom: 100 }} 
         showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0040a1" />}
      >
        {loading && !refreshing ? (
             <ActivityIndicator size="large" color="#0040a1" style={{marginTop: 40}} />
        ) : !selectedVehicle ? (
             <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-surface-container-low rounded-3xl p-8 shadow-sm mb-4 items-center justify-center mt-6 border border-outline-variant/30">
                 <MaterialIcons name="analytics" size={48} color="#c3c6d6" />
                 <Text className="text-on-surface font-extrabold text-xl mt-4">No vehicles found</Text>
                 <Text className="text-on-surface-variant text-sm font-medium mt-2">Add a vehicle in the Home tab first.</Text>
             </Animated.View>
        ) : (
             <>
                 {/* Health Score Overview */}
                 <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-8 items-center bg-surface p-8 rounded-[32px] shadow-sm border border-outline-variant/20 relative overflow-hidden">
                   <View className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full" />
                   <View className="absolute -left-4 bottom-0 w-24 h-24 bg-tertiary-fixed-dim/10 rounded-full" />
                   
                   <View className={`w-36 h-36 rounded-full border-[12px] ${selectedVehicle.healthStatus === 'Healthy' ? 'border-[#63f7ff]' : 'border-error'} items-center justify-center mb-6 shadow-sm shadow-primary/10 bg-surface`}>
                     <Text className="text-5xl font-extrabold text-on-surface">{getHealthScore(selectedVehicle.healthStatus)}</Text>
                     <Text className={`text-[10px] font-extrabold uppercase tracking-widest mt-1 ${selectedVehicle.healthStatus === 'Healthy' ? 'text-[#004f53]' : 'text-error'}`}>{selectedVehicle.healthStatus}</Text>
                   </View>
                   <Text className="text-xl font-extrabold text-on-surface mb-2 z-10">Overall Vehicle Health</Text>
                   <Text className="text-center text-sm text-on-surface-variant leading-5 z-10 font-medium">
                      {selectedVehicle.healthStatus === 'Healthy' 
                         ? 'All major systems are functioning normally.'
                         : 'Action required based on diagnostic readings.'}
                   </Text>
                 </Animated.View>

                 {/* Diagnostic Systems */}
                 <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} className="mb-6">
                   <Text className="font-bold text-lg text-on-surface mb-4">System Diagnostics</Text>
                   <View className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20">
                     
                     <View className="flex-row items-center justify-between p-5 border-b border-outline-variant/10">
                       <View className="flex-row items-center gap-4">
                         <View className="w-10 h-10 rounded-full bg-[#e8f5e9] items-center justify-center">
                           <MaterialIcons name="battery-charging-full" size={20} color="#1a6b2f" />
                         </View>
                         <Text className="font-bold text-on-surface">Battery Health</Text>
                       </View>
                       <Text className="font-bold text-[#1a6b2f]">Optimal ({selectedVehicle.battery}%)</Text>
                     </View>

                     <View className="flex-row items-center justify-between p-5 border-b border-outline-variant/10">
                       <View className="flex-row items-center gap-4">
                         <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                           <MaterialIcons name="bolt" size={20} color="#0040a1" />
                         </View>
                         <Text className="font-bold text-on-surface">Estimated Range</Text>
                       </View>
                       <Text className="font-bold text-primary">{selectedVehicle.range} km</Text>
                     </View>

                     <View className="flex-row items-center justify-between p-5 border-b border-outline-variant/10">
                       <View className="flex-row items-center gap-4">
                         <View className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center">
                           <MaterialIcons name="settings" size={20} color="#57657a" />
                         </View>
                         <Text className="font-bold text-on-surface">Engine/Motor</Text>
                       </View>
                       <Text className="font-bold text-on-surface-variant">Clear</Text>
                     </View>

                     <View className={`flex-row items-center justify-between p-5 flex-wrap ${selectedVehicle.tirePressure === 'OK' ? 'bg-surface' : 'bg-error-container/30'}`}>
                       <View className="flex-row items-center gap-4">
                         <View className={`w-10 h-10 rounded-full items-center justify-center ${selectedVehicle.tirePressure === 'OK' ? 'bg-primary/10' : 'bg-error-container'}`}>
                           <MaterialIcons name="tire-repair" size={20} color={selectedVehicle.tirePressure === 'OK' ? '#0040a1' : '#ba1a1a'} />
                         </View>
                         <Text className="font-bold text-on-surface">Tire Pressure</Text>
                       </View>
                       <Text className={`font-bold ${selectedVehicle.tirePressure === 'OK' ? 'text-primary' : 'text-error'}`}>{selectedVehicle.tirePressure}</Text>
                       {selectedVehicle.tirePressure !== 'OK' && (
                           <View className="w-full mt-3 bg-error-container p-3 rounded-xl border border-error/20">
                              <Text className="text-xs text-on-error-container font-medium">PSI indicates variance. Please check your sensors immediately.</Text>
                           </View>
                       )}
                     </View>
                     
                   </View>
                 </Animated.View>
                 
                 <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} className="mb-4">
                     <Text className="font-bold text-lg text-on-surface mb-3">Odometer Tracking</Text>
                     <View className="bg-surface-container rounded-3xl p-6 border border-outline-variant/20 shadow-sm flex-row items-center gap-5">
                         <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center shadow-sm">
                            <MaterialIcons name="speed" size={28} color="#0040a1" />
                         </View>
                         <View>
                            <Text className="font-extrabold text-3xl text-on-surface">{selectedVehicle.odometer} <Text className="text-lg text-on-surface-variant">km</Text></Text>
                            <Text className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Current Odometer</Text>
                         </View>
                     </View>
                 </Animated.View>
             </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
