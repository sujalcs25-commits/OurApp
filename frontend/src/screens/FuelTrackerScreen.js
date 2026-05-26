import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetchVehicles, addFuelLog, updateFuelLog, deleteFuelLog } from '../services/api';
import { formatINR } from '../utils/currency';

import UniversalAlert from '../utils/alert';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function FuelTrackerScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
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
      
      // Use first vehicle for storing fuel logs (backend requirement)
      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.error(error);
      UniversalAlert.alert('Error', 'Unable to fetch fuel history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    if (!selectedVehicle || !selectedVehicle.fuelLogs) return { totalSpent: 0, totalVolume: 0, logs: [] };

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

    return {
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      totalVolume: totalVolume.toFixed(1),
      logs: sortedLogs
    };
  }, [selectedVehicle]);

  const handleAddFuel = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedCost = parseFloat(cost);

    if (!amount || !cost) { UniversalAlert.alert('Error', 'Please enter both amount and cost.'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { UniversalAlert.alert('Error', 'Volume must be a positive number.'); return; }
    if (isNaN(parsedCost) || parsedCost <= 0) { UniversalAlert.alert('Error', 'Cost must be a positive number.'); return; }
    if (!selectedVehicle) { UniversalAlert.alert('Error', 'No vehicle selected to add fuel.'); return; }

    try {
      setAddingFuel(true);
      
      if (editingLog) {
        // Update existing log
        await updateFuelLog(selectedVehicle.id || selectedVehicle._id, editingLog.id || editingLog._id, { 
          amount: parsedAmount, 
          cost: parsedCost 
        });
      } else {
        // Add new log
        await addFuelLog(selectedVehicle.id || selectedVehicle._id, { 
          amount: parsedAmount, 
          cost: parsedCost 
        });
      }
      
      setModalVisible(false);
      resetForm();
      await loadData(true);
    } catch (error) {
      UniversalAlert.alert('Error', error?.response?.data?.msg || 'Failed to save fuel log.');
    } finally {
      setAddingFuel(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setAmount(log.amount.toString());
    setCost(log.cost.toString());
    setModalVisible(true);
  };

  const handleDelete = (log) => {
    UniversalAlert.alert(
      'Delete Fuel Log',
      'Are you sure you want to delete this fuel record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const vehicleId = selectedVehicle.id || selectedVehicle._id;
              const logId = log.id || log._id;
              console.log('Deleting fuel log:', { vehicleId, logId });
              await deleteFuelLog(vehicleId, logId);
              await loadData(true);
              UniversalAlert.alert('Success', 'Fuel log deleted successfully.');
            } catch (error) {
              console.error('Delete error:', error);
              const errorMsg = error?.response?.data?.msg || error?.message || 'Failed to delete fuel log.';
              UniversalAlert.alert('Error', errorMsg);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setEditingLog(null);
    setAmount('');
    setCost('');
    setOdometer('');
  };

  const renderLogItem = ({ item: log, index }) => {
    const dateObj = new Date(log.createdAt);
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
        <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between shadow-sm border border-outline-variant/20 mb-3">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-12 h-12 rounded-xl bg-surface-container-high items-center justify-center">
              <Text className="font-extrabold text-on-surface text-base">{dateObj.getDate()}</Text>
              <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{dateObj.toLocaleString('en-IN', { month: 'short' })}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-on-surface text-base">Fuel Fill-up</Text>
              <Text className="text-xs text-on-surface-variant mt-1 font-medium">{log.amount} L</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="items-end mr-2">
              <Text className="font-extrabold text-primary text-lg">{formatINR(log.cost)}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleEdit(log)} 
              className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center"
            >
              <MaterialIcons name="edit" size={18} color="#0040a1" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(log)} 
              className="w-10 h-10 bg-error-container/20 rounded-full items-center justify-center"
            >
              <MaterialIcons name="delete" size={18} color="#ba1a1a" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <View className="mb-6">
        <Text className="font-extrabold text-3xl text-on-surface">Fuel Expenses</Text>
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

        <View className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/10">
          <Text className="text-on-surface-variant text-xs font-bold mb-1 uppercase tracking-wider">Total Volume</Text>
          <Text className="font-extrabold text-2xl text-on-surface">{stats.totalVolume} <Text className="text-sm font-medium">Liters</Text></Text>
          <MaterialIcons name="local-gas-station" size={20} color="#0040a1" className="absolute top-4 right-4 opacity-50" />
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
          <Text className="text-xl font-extrabold tracking-tight text-on-surface">Fuel Expenses</Text>
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
             keyExtractor={(item) => (item.id || item._id || Math.random().toString()).toString()}
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
                <Text className="text-2xl font-extrabold text-on-surface">{editingLog ? 'Edit' : 'Add'} Fuel Record</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                   <MaterialIcons name="close" size={20} color="#111c2d" />
                </TouchableOpacity>
             </View>
             
             <Input label="Amount Spent (₹)" placeholder="e.g. 3500.00" keyboardType="numeric" value={cost} onChangeText={setCost} icon="currency-rupee" />
             <Input label="Fuel Volume (Liters)" placeholder="e.g. 35.5" keyboardType="numeric" value={amount} onChangeText={setAmount} icon="water-drop" />

             <View className="mt-4">
                <Button title={editingLog ? 'Update Record' : 'Save Record'} onPress={handleAddFuel} loading={addingFuel} icon="save" />
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
          onPress={() => { resetForm(); setModalVisible(true); }}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40"
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f9f9ff' } });
