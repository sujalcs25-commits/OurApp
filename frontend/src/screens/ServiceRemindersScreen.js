import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  Alert, RefreshControl, FlatList, Platform, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetchVehicles, addServiceLog, updateServiceLog } from '../services/api';

import UniversalAlert from '../utils/alert';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// ─── Load native date picker only on iOS/Android ──────────────────────────────
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('DateTimePicker not available:', error);
  }
}

// ─── Cross-platform date picker component ─────────────────────────────────────
const CrossDatePicker = ({ value, onChange, onClose }) => {
  if (Platform.OS === 'web') {
    // On web: inject a real HTML <input type="date">
    return React.createElement('input', {
      type: 'date',
      value: value || '',
      onChange: (e) => onChange(e.target.value),
      style: {
        backgroundColor: '#eef0f8',
        borderRadius: 16,
        padding: '14px 18px',
        fontSize: 15,
        fontWeight: '700',
        color: value ? '#111c2d' : '#aaa',
        border: '1.5px solid #e2e4f0',
        outline: 'none',
        width: '100%',
        display: 'block',
        cursor: 'pointer',
        boxSizing: 'border-box',
        marginBottom: 20,
      },
    });
  }

  if (!DateTimePicker) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <DateTimePicker
        value={value && !isNaN(new Date(value)) ? new Date(value) : new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, date) => {
          if (Platform.OS === 'android') onClose();
          if (date) onChange(date.toISOString().split('T')[0]);
        }}
      />
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={onClose}
          style={{ backgroundColor: '#0040a1', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ServiceRemindersScreen = () => {
  const [vehicles,        setVehicles]        = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);

  // Form state
  const [type,        setType]        = useState('');
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [saving,      setSaving]      = useState(false);

  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => { loadData(); }, []);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await fetchVehicles();
      setVehicles(data || []);

      setSelectedVehicle(prev => {
        if (!data?.length) return null;
        if (prev) {
          const id    = prev.id || prev._id;
          const found = data.find(v => (v.id || v._id) === id);
          return found || data[0];
        }
        return data.find(v => v.isPrimary) || data[0];
      });
    } catch (err) {
      UniversalAlert.alert('Error', 'Could not load garage data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const resetForm = () => { setType(''); setDescription(''); setServiceDate(''); setShowPicker(false); };

  const handleAdd = async () => {
    if (!type.trim())        { UniversalAlert.alert('Missing', 'Please enter the service type.');   return; }
    if (!selectedVehicle)    { UniversalAlert.alert('Missing', 'No vehicle selected.');             return; }

    try {
      setSaving(true);
      await addServiceLog(selectedVehicle.id || selectedVehicle._id, {
        type:        type.trim(),
        description: description.trim(),
        serviceDate: serviceDate || new Date().toISOString().split('T')[0],
        status:      'Upcoming',
      });
      setModalVisible(false);
      resetForm();
      await loadData(true);
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || 'Failed to add service.';
      UniversalAlert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (logId, status) => {
    try {
      const vId = selectedVehicle?.id || selectedVehicle?._id;
      if (!vId) return;
      await updateServiceLog(vId, logId, { status });
      await loadData(true);
    } catch {
      UniversalAlert.alert('Error', 'Status update failed.');
    }
  };

  // ── Filtering (case-insensitive) ────────────────────────────────────────────
  const allLogs     = selectedVehicle?.serviceLogs || [];
  const sorted      = [...allLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const upcomingLog = sorted.filter(l => { const s = (l.status||'').trim().toLowerCase(); return !s || s === 'upcoming' || s === 'in progress'; });
  const doneLog     = sorted.filter(l => { const s = (l.status||'').trim().toLowerCase(); return s === 'completed' || s === 'cancelled'; });

  // ── Header ──────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={{ marginBottom: 24 }}>
      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#111c2d', letterSpacing: -1 }}>Garage</Text>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#0040a1', letterSpacing: 2, textTransform: 'uppercase' }}>Maintenance Control</Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setModalVisible(true); }}
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#0040a1', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vehicle card */}
      <View style={{ backgroundColor: '#f4f6ff', borderRadius: 28, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#e2e4f0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#0040a1', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="directions-car" size={22} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' }}>Selected Vehicle</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111c2d' }}>
              {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'No vehicle'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#d4f5de', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#1a6b2f', textTransform: 'uppercase' }}>{selectedVehicle?.licensePlate || '–'}</Text>
          </View>
          <View style={{ backgroundColor: '#dde8ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#0040a1', textTransform: 'uppercase' }}>{upcomingLog.length} Active</Text>
          </View>
        </View>
      </View>

      {/* Active goals heading */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111c2d' }}>Active Goals</Text>
        <View style={{ flex: 1, height: 2, backgroundColor: '#f0f0f6', marginLeft: 12, borderRadius: 2 }} />
      </View>

      {upcomingLog.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.3 }}>
          <MaterialIcons name="auto-awesome" size={48} color="#0040a1" />
          <Text style={{ fontWeight: '700', fontSize: 13, marginTop: 8, color: '#111c2d' }}>All clear. Everything is running smooth.</Text>
        </View>
      )}
    </View>
  );

  const renderGoal = ({ item: log, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 80)}>
      <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#eaecf5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111c2d', letterSpacing: -0.3 }}>{log.type}</Text>
          {log.description ? (
            <Text style={{ fontSize: 12, color: '#888', marginTop: 3 }} numberOfLines={1}>{log.description}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
            <MaterialIcons name="event" size={13} color="#0040a1" />
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#0040a1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {log.serviceDate
                ? new Date(log.serviceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'No date set'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleStatus(log.id || log._id, 'Completed')}
          style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: '#0040a1', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="check" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderFooter = () => (
    <View style={{ marginTop: 32, paddingBottom: tabBarHeight + 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111c2d' }}>History</Text>
        <View style={{ flex: 1, height: 2, backgroundColor: '#f0f0f6', marginLeft: 12, borderRadius: 2 }} />
      </View>

      {doneLog.length === 0 ? (
        <Text style={{ textAlign: 'center', paddingVertical: 32, color: '#bbb', fontWeight: '700', fontSize: 12 }}>
          Completed tasks will appear here.
        </Text>
      ) : doneLog.map((log, idx) => (
        <View key={log.id || log._id || idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f2f2f8' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#d4f5de', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="done-all" size={20} color="#1a6b2f" />
            </View>
            <View>
              <Text style={{ fontWeight: '800', fontSize: 15, color: '#111c2d' }}>{log.type}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                {new Date(log.serviceDate || log.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleStatus(log.id || log._id, 'Upcoming')}
            style={{ backgroundColor: '#f0f2f8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
          >
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>Restore</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafbff' }} edges={['top']}>
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0040a1" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 24 }}
          data={upcomingLog}
          keyExtractor={(item, i) => String(item.id || item._id || i)}
          renderItem={renderGoal}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0040a1" />}
        />
      )}

      {/* ── Add Service Modal ───────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 28, paddingBottom: 40, maxHeight: '92%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Modal header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#111c2d', letterSpacing: -0.5 }}>New Goal</Text>
                <TouchableOpacity
                  onPress={() => { setModalVisible(false); resetForm(); }}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f2f8', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="close" size={22} color="#111c2d" />
                </TouchableOpacity>
              </View>

              {/* Vehicle selector (multi-vehicle) */}
              {vehicles.length > 1 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Assign to vehicle</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {vehicles.map(v => {
                      const active = (v.id || v._id) === (selectedVehicle?.id || selectedVehicle?._id);
                      return (
                        <TouchableOpacity
                          key={v.id || v._id}
                          onPress={() => setSelectedVehicle(v)}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#0040a1' : '#f0f2f8' }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#fff' : '#555', textTransform: 'uppercase' }}>{v.licensePlate}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Service type */}
              <Input label="Service Type *" placeholder="e.g. Oil Change, Tyre Rotation" value={type} onChangeText={setType} icon="build" />

              {/* Date section */}
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Schedule Date
              </Text>

              {Platform.OS === 'web' ? (
                // Web: real HTML date input via React.createElement
                <CrossDatePicker value={serviceDate} onChange={setServiceDate} onClose={() => setShowPicker(false)} />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowPicker(p => !p)}
                    style={{ backgroundColor: '#f0f2f8', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e4f0' }}
                  >
                    <MaterialIcons name="calendar-today" size={22} color="#0040a1" />
                    <Text style={{ fontWeight: '700', color: serviceDate ? '#111c2d' : '#aaa', fontSize: 15 }}>
                      {serviceDate
                        ? new Date(serviceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Tap to pick a date'}
                    </Text>
                  </TouchableOpacity>
                  {showPicker && (
                    <CrossDatePicker value={serviceDate} onChange={setServiceDate} onClose={() => setShowPicker(false)} />
                  )}
                </>
              )}

              {/* Notes */}
              <Input label="Notes (optional)" placeholder="Parts, mechanic, or shop" value={description} onChangeText={setDescription} icon="notes" multiline />

              {/* Submit */}
              <View style={{ marginTop: 20 }}>
                <Button title="Add to Upcoming" onPress={handleAdd} loading={saving} icon="bolt" />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ServiceRemindersScreen;
