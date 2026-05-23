import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetchVehicles, addFuelLog } from '../services/api';
import { formatINR } from '../utils/currency';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function FuelTrackerScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [addingFuel, setAddingFuel] = useState(false);

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));
  
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => { loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchVehicles();
      setVehicles(data);
      if (data.length > 0) setSelectedVehicle(data[0]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to fetch fuel history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    if (!selectedVehicle || !selectedVehicle.fuelLogs) return { totalSpent: 0, totalVolume: 0, avgEff: 0, logs: [] };

    const sortedLogs = [...selectedVehicle.fuelLogs].sort((a, b) => {
      // Primary sort by odometer (descending), fallback to createdAt
      if (b.odometer !== a.odometer) return (b.odometer || 0) - (a.odometer || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    let totalSpent = 0;
    let totalVolume = 0;
    sortedLogs.forEach(log => {
      totalSpent += Number(log.cost || 0);
      totalVolume += Number(log.amount || 0);
    });

    let avgEff = 0;
    // For efficiency, we need the distance between the earliest and latest log.
    // However, the volume of the latest fill-up hasn't been "used" to cover the distance yet.
    // Standard avg = Total Distance / Total Volume (excluding the very first fill-up volume)
    if (sortedLogs.length >= 2) {
      const latestOdo = sortedLogs[0].odometer;
      const oldestOdo = sortedLogs[sortedLogs.length - 1].odometer;
      const distance = latestOdo - oldestOdo;
      
      // Calculate volume used to cover that distance (everything except the oldest fill value)
      // Because the oldest fill-up was the "start" of the tracking.
      let usedVolume = 0;
      for (let i = 0; i < sortedLogs.length - 1; i++) {
        usedVolume += Number(sortedLogs[i].amount || 0);
      }

      if (distance > 0 && usedVolume > 0) avgEff = distance / usedVolume;
    }

    return {
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      totalVolume: totalVolume.toFixed(1),
      avgEff: avgEff > 0 ? avgEff.toFixed(1) : '-',
      logs: sortedLogs
    };
  }, [selectedVehicle]);

  const handleAddFuel = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedCost = parseFloat(cost);

    if (!amount || !cost) { Alert.alert('Error', 'Please enter both amount and cost.'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { Alert.alert('Error', 'Volume must be a positive number.'); return; }
    if (isNaN(parsedCost) || parsedCost <= 0) { Alert.alert('Error', 'Cost must be a positive number.'); return; }
    if (!selectedVehicle) { Alert.alert('Error', 'No vehicle selected to add fuel.'); return; }

    try {
      setAddingFuel(true);
      await addFuelLog(selectedVehicle.id, { amount: parsedAmount, cost: parsedCost, odometer });
      setModalVisible(false);
      setAmount(''); setCost(''); setOdometer('');
      await loadData(true);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.msg || 'Failed to add fuel log.');
    } finally {
      setAddingFuel(false);
    }
  };

  const renderLogItem = ({ item: log, index }) => {
    const dateObj = new Date(log.createdAt);
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
        <TouchableOpacity activeOpacity={0.7} className="bg-surface rounded-2xl p-4 flex-row items-center justify-between shadow-sm border border-outline-variant/20 mb-3">
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-xl bg-surface-container-high items-center justify-center">
              <Text className="font-extrabold text-on-surface text-base">{dateObj.getDate()}</Text>
              <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{dateObj.toLocaleString('en-IN', { month: 'short' })}</Text>
            </View>
            <View>
              <Text className="font-bold text-on-surface text-base">Fill-up</Text>
              <Text className="text-xs text-on-surface-variant mt-1 font-medium">{log.amount} L • {formatINR(log.cost)}</Text>
            </View>
          </View>
          <View className="items-end bg-surface-container-low px-3 py-2 rounded-lg">
            <Text className="font-extrabold text-primary text-base">{log.odometer ? `${log.odometer} ` : '-'}<Text className="text-xs text-primary font-medium">km</Text></Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <View className="mb-6">
        <Text className="font-extrabold text-3xl text-on-surface">Fuel Analytics</Text>
        <Text className="text-on-surface-variant text-sm mt-1 font-medium">{currentMonth} Summary</Text>
      </View>

      <View className="flex-col gap-4 mb-8">
        <View className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex-row justify-between items-center">
          <View>
            <Text className="text-on-surface-variant text-sm font-bold mb-1 uppercase tracking-wider">Total Spent</Text>
            <Text className="font-extrabold text-3xl text-on-surface">{formatINR(stats.totalSpent)}</Text>
            <Text className="text-xs text-on-surface-variant mt-1 font-medium"><Text className="text-primary font-bold">{stats.logs.length}</Text> recorded logs</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MaterialIcons name="payments" size={24} color="#0040a1" />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/10 flex-1">
            <Text className="text-on-surface-variant text-xs font-bold mb-1 uppercase tracking-wider">Volume</Text>
            <Text className="font-extrabold text-2xl text-on-surface">{stats.totalVolume} <Text className="text-sm font-medium">L</Text></Text>
            <MaterialIcons name="local-gas-station" size={20} color="#0040a1" className="absolute top-4 right-4 opacity-50" />
          </View>

          <View className="bg-primary rounded-2xl p-5 shadow-sm flex-1">
            <Text className="text-white/80 text-xs font-bold mb-1 uppercase tracking-wider">Efficiency</Text>
            <Text className="font-extrabold text-2xl text-white">{stats.avgEff} <Text className="text-sm font-medium">{stats.avgEff !== '-' ? 'km/L' : ''}</Text></Text>
            <MaterialIcons name="speed" size={20} color="#fff" className="absolute top-4 right-4 opacity-50" />
          </View>
        </View>
      </View>

      <View className="mb-4 flex-row justify-between items-center">
        <Text className="font-bold text-lg text-on-surface">Recent Logs</Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-background">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
            <MaterialIcons name="local-gas-station" size={20} color="#0040a1" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold tracking-tight text-on-surface">Fuel Tracker</Text>
        </View>
        <View className="bg-primary/10 py-1 px-3 rounded-full border border-primary/20">
            <Text className="text-primary text-xs font-bold">{selectedVehicle ? selectedVehicle.licensePlate : 'Garage'}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
             <ActivityIndicator size="large" color="#0040a1" />
          </View>
      ) : !selectedVehicle ? (
          <View className="flex-1 px-6 pt-4">
             {renderHeader()}
             <View className="bg-surface-container-low rounded-3xl p-8 shadow-sm mb-4 items-center justify-center mt-6 border border-outline-variant/30">
                 <MaterialIcons name="local-gas-station" size={48} color="#c3c6d6" />
                 <Text className="text-on-surface font-extrabold text-xl mt-4">No vehicles found</Text>
                 <Text className="text-on-surface-variant text-sm font-medium mt-2">Add a vehicle in the Home tab first.</Text>
             </View>
          </View>
      ) : (
          <FlatList
             className="flex-1 px-6 pt-4"
             contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
             showsVerticalScrollIndicator={false}
             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0040a1" />}
             data={stats.logs}
             keyExtractor={(item) => item.id.toString()}
             ListHeaderComponent={renderHeader}
             renderItem={renderLogItem}
             ListEmptyComponent={
               <View className="bg-surface-container-low rounded-3xl p-8 shadow-sm mb-4 items-center justify-center py-10 border border-outline-variant/30">
                   <MaterialIcons name="receipt-long" size={48} color="#c3c6d6" />
                   <Text className="text-on-surface font-extrabold text-xl mt-4">No fuel logs yet</Text>
                   <Text className="text-on-surface-variant text-sm font-medium mt-2 text-center">Tap the (+) button to record your first fill-up!</Text>
               </View>
             }
          />
      )}

      {/* Add Fuel Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 pb-10">
             <View className="flex-row justify-between items-center mb-8">
                <Text className="text-2xl font-extrabold text-on-surface">Add Fuel Record</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                   <MaterialIcons name="close" size={20} color="#111c2d" />
                </TouchableOpacity>
             </View>
             
             <Input label="Cost (₹)" placeholder="e.g. 3500.00" keyboardType="numeric" value={cost} onChangeText={setCost} icon="currency-rupee" />
             <Input label="Volume (Liters)" placeholder="e.g. 35.5" keyboardType="numeric" value={amount} onChangeText={setAmount} icon="water-drop" />
             <Input label="Odometer (km)" placeholder="Optional" keyboardType="numeric" value={odometer} onChangeText={setOdometer} icon="speed" />

             <View className="mt-4">
                <Button title="Save Record" onPress={handleAddFuel} loading={addingFuel} icon="save" />
             </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <Animated.View style={[fabStyle, { position: 'absolute', bottom: tabBarHeight + 20, right: 24 }]}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPressIn={() => (fabScale.value = withSpring(0.9))}
          onPressOut={() => (fabScale.value = withSpring(1))}
          onPress={() => setModalVisible(true)}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40"
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f9f9ff' } });
