import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { fetchVehicles, addVehicle, updateVehicle, deleteVehicle, setPrimaryVehicle } from '../services/api';

import UniversalAlert from '../utils/alert';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other'];

const FUEL_ICONS = {
  Petrol:   'local-gas-station',
  Diesel:   'local-gas-station',
  Electric: 'bolt',
  Hybrid:   'eco',
  CNG:      'local-gas-station',
  Other:    'directions-car',
};

// ─── Fuel type picker ─────────────────────────────────────────────────────────
function FuelTypePicker({ value, onChange }) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-6">
      {FUEL_TYPES.map((ft) => (
        <TouchableOpacity
          key={ft}
          onPress={() => onChange(ft)}
          activeOpacity={0.7}
          className={`px-4 py-2 rounded-full border ${value === ft ? 'bg-primary border-primary' : 'bg-surface-container border-outline-variant/30'}`}
        >
          <Text className={`text-xs font-bold ${value === ft ? 'text-on-primary' : 'text-on-surface-variant'}`}>{ft}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Vehicle card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onEdit, onDelete, onSetPrimary, onViewHistory, index }) {
  const isPrimary = vehicle.isPrimary;
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600).springify()}>
      <View className={`bg-surface rounded-3xl p-5 mb-4 shadow-sm border ${isPrimary ? 'border-primary shadow-primary/20' : 'border-outline-variant/20'}`}>
        {isPrimary && (
          <View className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full self-start mb-4 shadow-sm">
            <MaterialIcons name="star" size={12} color="#fff" />
            <Text className="text-[10px] font-bold text-on-primary uppercase tracking-widest">Primary</Text>
          </View>
        )}

        {/* Header row */}
        <View className="flex-row items-center gap-4 mb-5">
          <View className={`w-14 h-14 rounded-full items-center justify-center ${isPrimary ? 'bg-primary' : 'bg-surface-container-highest'}`}>
            <MaterialIcons name={FUEL_ICONS[vehicle.fuelType] || 'directions-car'} size={28} color={isPrimary ? '#fff' : '#0040a1'} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-on-surface">{vehicle.make} {vehicle.model}</Text>
            <Text className="text-xs text-on-surface-variant mt-1 font-medium">{vehicle.year || 'N/A'} • {vehicle.licensePlate !== 'Pending' ? vehicle.licensePlate : 'No Plate'}</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${vehicle.healthStatus === 'Healthy' ? 'bg-[#d4edda]' : 'bg-error-container'}`}>
            <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${vehicle.healthStatus === 'Healthy' ? 'text-[#1a6b2f]' : 'text-error'}`}>
              {vehicle.healthStatus}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row bg-surface-container-low rounded-2xl p-4 mb-5 items-center justify-between">
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-on-surface">{vehicle.odometer?.toLocaleString('en-IN') || 0}</Text>
            <Text className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold tracking-widest">km</Text>
          </View>
          <View className="w-[1px] h-8 bg-outline-variant/30" />
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-on-surface">{vehicle.fuelType || 'Petrol'}</Text>
            <Text className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold tracking-widest">Fuel</Text>
          </View>
          <View className="w-[1px] h-8 bg-outline-variant/30" />
          <View className="items-center flex-1">
            <Text className="text-lg font-extrabold text-on-surface">{vehicle.serviceLogs?.length || 0}</Text>
            <Text className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold tracking-widest">Services</Text>
          </View>
        </View>

        {/* Next service due banner */}
        {(vehicle.nextServiceDue || vehicle.nextServiceKm) && (
          <View className="flex-row items-center gap-2 bg-primary-fixed-dim/20 rounded-xl px-4 py-3 mb-5 border border-primary/10">
            <MaterialIcons name="build-circle" size={18} color="#0040a1" />
            <Text className="text-xs font-bold text-primary flex-1">
              Next service:{' '}
              {vehicle.nextServiceDue ? new Date(vehicle.nextServiceDue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              {vehicle.nextServiceDue && vehicle.nextServiceKm ? '  •  ' : ''}
              {vehicle.nextServiceKm ? `${vehicle.nextServiceKm.toLocaleString('en-IN')} km` : ''}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-2 flex-wrap">
          <TouchableOpacity onPress={() => onViewHistory(vehicle)} className="flex-row items-center justify-center gap-1.5 bg-surface-container px-3 py-2.5 rounded-xl flex-1 border border-outline-variant/10">
            <MaterialIcons name="history" size={16} color="#0040a1" />
            <Text className="text-xs font-bold text-primary">History</Text>
          </TouchableOpacity>

          {!isPrimary && (
            <TouchableOpacity onPress={() => onSetPrimary(vehicle)} className="flex-row items-center justify-center gap-1.5 bg-surface-container px-3 py-2.5 rounded-xl flex-1 border border-outline-variant/10">
              <MaterialIcons name="star-outline" size={16} color="#0040a1" />
              <Text className="text-xs font-bold text-primary">Primary</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => onEdit(vehicle)} className="flex-row items-center justify-center gap-1.5 bg-surface-container px-3 py-2.5 rounded-xl flex-1 border border-outline-variant/10">
            <MaterialIcons name="edit" size={16} color="#0040a1" />
            <Text className="text-xs font-bold text-primary">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onDelete(vehicle)} className="flex-row items-center justify-center gap-1.5 bg-error-container/30 px-3 py-2.5 rounded-xl flex-1 border border-error/20">
            <MaterialIcons name="delete-outline" size={16} color="#ba1a1a" />
            <Text className="text-xs font-bold text-error">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Service history modal ────────────────────────────────────────────────────
function ServiceHistoryModal({ vehicle, visible, onClose }) {
  if (!vehicle) return null;
  const logs = [...(vehicle.serviceLogs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[85%]">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-extrabold text-on-surface">Service History</Text>
              <Text className="text-sm text-on-surface-variant font-medium mt-1">{vehicle.make} {vehicle.model}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
              <MaterialIcons name="close" size={20} color="#111c2d" />
            </TouchableOpacity>
          </View>

          {logs.length === 0 ? (
            <View className="items-center py-10 bg-surface-container-low rounded-3xl border border-outline-variant/30">
              <MaterialIcons name="build" size={48} color="#c3c6d6" />
              <Text className="text-on-surface font-bold text-lg mt-4">No service records yet</Text>
              <Text className="text-on-surface-variant text-sm mt-2 text-center px-6">Go to the Care tab to log your first service.</Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id || item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="flex-row items-center gap-4 py-4 border-b border-outline-variant/10">
                  <View className={`w-12 h-12 rounded-full ${item.status === 'Completed' ? 'bg-[#d4edda]' : item.status === 'Cancelled' ? 'bg-error-container/30' : 'bg-primary/10'} items-center justify-center`}>
                    <MaterialIcons 
                      name={item.status === 'Completed' ? 'check-circle' : item.status === 'Cancelled' ? 'cancel' : 'build'} 
                      size={20} 
                      color={item.status === 'Completed' ? '#1a6b2f' : item.status === 'Cancelled' ? '#ba1a1a' : '#0040a1'} 
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                       <Text className="text-base font-bold text-on-surface">{item.type}</Text>
                       <View className={`px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-[#d4edda]' : 'bg-surface-container-highest'}`}>
                          <Text className={`text-[8px] font-black uppercase ${item.status === 'Completed' ? 'text-[#1a6b2f]' : 'text-on-surface-variant'}`}>{item.status || 'Past'}</Text>
                       </View>
                    </View>
                    {item.description ? <Text className="text-xs text-on-surface-variant mt-1 font-medium">{item.description}</Text> : null}
                    <Text className="text-[10px] text-outline uppercase font-bold tracking-wider mt-2">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyVehiclesScreen({ navigation }) {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add/Edit modal
  const [formVisible, setFormVisible]   = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [make, setMake]                 = useState('');
  const [model, setModel]               = useState('');
  const [year, setYear]                 = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [odometer, setOdometer]         = useState('');
  const [fuelType, setFuelType]         = useState('Petrol');
  const [color, setColor]               = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [nextServiceDue, setNextServiceDue]   = useState('');
  const [nextServiceKm, setNextServiceKm]     = useState('');
  const [makeErr, setMakeErr]           = useState('');
  const [modelErr, setModelErr]         = useState('');
  const [submitting, setSubmitting]     = useState(false);

  // History modal
  const [historyVehicle, setHistoryVehicle] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const loadVehicles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchVehicles();
      setVehicles(data);
    } catch {
      UniversalAlert.alert('Error', 'Failed to load vehicles. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const openAdd = () => {
    setEditingVehicle(null);
    setMake(''); setModel(''); setYear(''); setLicensePlate('');
    setOdometer(''); setFuelType('Petrol'); setColor('');
    setLastServiceDate(''); setNextServiceDue(''); setNextServiceKm('');
    setMakeErr(''); setModelErr('');
    setFormVisible(true);
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setMake(vehicle.make || ''); setModel(vehicle.model || '');
    setYear(vehicle.year ? String(vehicle.year) : '');
    setLicensePlate(vehicle.licensePlate !== 'Pending' ? vehicle.licensePlate : '');
    setOdometer(vehicle.odometer ? String(vehicle.odometer) : '');
    setFuelType(vehicle.fuelType || 'Petrol'); setColor(vehicle.color || '');
    setLastServiceDate(vehicle.lastServiceDate ? vehicle.lastServiceDate.slice(0, 10) : '');
    setNextServiceDue(vehicle.nextServiceDue   ? vehicle.nextServiceDue.slice(0, 10)  : '');
    setNextServiceKm(vehicle.nextServiceKm     ? String(vehicle.nextServiceKm)        : '');
    setMakeErr(''); setModelErr('');
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    let valid = true;
    if (!make.trim()) { setMakeErr('Make is required'); valid = false; } else setMakeErr('');
    if (!model.trim()) { setModelErr('Model is required'); valid = false; } else setModelErr('');
    
    if (!valid) {
      UniversalAlert.alert('Validation Error', 'Please fill in the required fields (Make and Model).');
      return;
    }

    const payload = {
      make: make.trim(), model: model.trim(),
      year: year ? Number(year) : null,
      licensePlate: licensePlate.trim() || 'Pending',
      odometer: odometer ? Number(odometer) : 0,
      fuelType, color: color.trim(),
      lastServiceDate: lastServiceDate || null,
      nextServiceDue:  nextServiceDue  || null,
      nextServiceKm:   nextServiceKm   ? Number(nextServiceKm) : null,
    };

    try {
      setSubmitting(true);
      if (editingVehicle) await updateVehicle(editingVehicle.id, payload);
      else await addVehicle(payload);
      setFormVisible(false);
      await loadVehicles();
    } catch (err) {
      UniversalAlert.alert('Error', err?.response?.data?.msg || 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (vehicle) => {
    UniversalAlert.alert(
      '🚨 Permanent Deletion!',
      `You are about to delete the ${vehicle.make} ${vehicle.model}.\n\nThis will PERMANENTLY remove:\n• All Fuel Logs\n• All Service Records\n• All Digital Documents\n\nThis action cannot be undone. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Everything', style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteVehicle(vehicle.id);
              setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
              UniversalAlert.alert('Success', 'Vehicle and all related data removed.');
            } catch { UniversalAlert.alert('Error', 'Could not delete vehicle.'); }
            finally { setLoading(false); }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (vehicle) => {
    try {
      await setPrimaryVehicle(vehicle.id);
      setVehicles((prev) => prev.map((v) => ({ ...v, isPrimary: v.id === vehicle.id })));
    } catch { UniversalAlert.alert('Error', 'Could not set primary vehicle.'); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-on-surface">My Garage</Text>
        <View className="bg-primary w-8 h-8 rounded-full items-center justify-center shadow-sm shadow-primary/30">
          <Text className="text-on-primary font-bold text-sm">{vehicles.length}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0040a1" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => loadVehicles(true)}
          refreshing={refreshing}
          renderItem={({ item, index }) => (
            <VehicleCard
              vehicle={item}
              index={index}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              onViewHistory={() => { setHistoryVehicle(item); setHistoryVisible(true); }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/30 mt-4">
              <MaterialIcons name="directions-car" size={64} color="#c3c6d6" />
              <Text className="text-xl font-extrabold text-on-surface mt-6">Your garage is empty</Text>
              <Text className="text-sm text-on-surface-variant text-center mt-2 px-6">Tap the + button below to add your first vehicle.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Animated.View style={[fabStyle, { position: 'absolute', bottom: 32, right: 24 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={() => (fabScale.value = withSpring(0.9))}
          onPressOut={() => (fabScale.value = withSpring(1))}
          onPress={openAdd}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/50"
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-on-surface">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="close" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input label="Make *" value={make} onChangeText={(v) => { setMake(v); setMakeErr(''); }} placeholder="e.g. Toyota" autoCapitalize="words" error={makeErr} />
              <Input label="Model *" value={model} onChangeText={(v) => { setModel(v); setModelErr(''); }} placeholder="e.g. Innova" autoCapitalize="words" error={modelErr} />
              
              <View className="flex-row gap-4 mb-2">
                <View className="flex-1">
                  <Input label="Year" value={year} onChangeText={setYear} placeholder="2022" keyboardType="numeric" />
                </View>
                <View className="flex-1">
                  <Input label="Color" value={color} onChangeText={setColor} placeholder="White" autoCapitalize="words" />
                </View>
              </View>

              <Input label="License Plate" value={licensePlate} onChangeText={setLicensePlate} placeholder="ABC 1234" autoCapitalize="characters" />
              <Input label="Odometer (km)" value={odometer} onChangeText={setOdometer} placeholder="15000" keyboardType="numeric" icon="speed" />
              
              <Text className="text-on-surface-variant text-xs font-semibold mb-2 uppercase tracking-wider">Fuel Type</Text>
              <FuelTypePicker value={fuelType} onChange={setFuelType} />

              <Text className="text-on-surface-variant text-xs font-semibold mb-3 uppercase tracking-wider">Maintenance Schedule (Optional)</Text>
              <Input label="Last Service (YYYY-MM-DD)" value={lastServiceDate} onChangeText={setLastServiceDate} placeholder="2024-01-15" icon="calendar-today" />
              <Input label="Next Service (YYYY-MM-DD)" value={nextServiceDue} onChangeText={setNextServiceDue} placeholder="2024-07-15" icon="calendar-today" />
              <Input label="Next Service (km)" value={nextServiceKm} onChangeText={setNextServiceKm} placeholder="20000" keyboardType="numeric" icon="speed" />

              <View className="mt-4 mb-8">
                <Button 
                  title={editingVehicle ? 'Save Changes' : 'Add to Garage'} 
                  onPress={handleSubmit} 
                  loading={submitting} 
                  icon={editingVehicle ? 'save' : 'add-circle'} 
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Service History Modal ──────────────────────────────────────────── */}
      <ServiceHistoryModal vehicle={historyVehicle} visible={historyVisible} onClose={() => setHistoryVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f9f9ff' } });
