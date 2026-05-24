import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, RefreshControl, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { fetchVehicles, addEcoLog } from '../services/api';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function previewCalc(distanceKm, baseEfficiency, improvedEfficiency) {
  const d = parseFloat(distanceKm);
  const b = parseFloat(baseEfficiency);
  const i = parseFloat(improvedEfficiency);
  if (!d || !b || !i || b <= 0 || i <= 0 || d <= 0) return null;
  const fuelSaved = d / b - d / i;
  if (fuelSaved <= 0) return null;
  return {
    fuelSaved: fuelSaved.toFixed(2),
    co2Saved: (fuelSaved * 2.31).toFixed(2),
    trees: (fuelSaved * 2.31 / 21).toFixed(2),
    km: (fuelSaved * 12).toFixed(1),
  };
}

export default function EcoImpactScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [baseEfficiency, setBaseEfficiency] = useState('');
  const [improvedEfficiency, setImprovedEfficiency] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
    } catch {
      Alert.alert('Error', 'Unable to load eco data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ecoStats = useMemo(() => {
    const logs = selectedVehicle?.ecoLogs ?? [];
    const totals = logs.reduce(
      (acc, e) => ({
        co2: parseFloat((acc.co2 + (e.co2SavedKg || 0)).toFixed(2)),
        trees: parseFloat((acc.trees + (e.treesEquivalent || 0)).toFixed(2)),
        fuel: parseFloat((acc.fuel + (e.fuelSavedLitres || 0)).toFixed(3)),
        km: parseFloat((acc.km + (e.kmEquivalent || 0)).toFixed(1)),
      }),
      { co2: 0, trees: 0, fuel: 0, km: 0 }
    );
    const ecoScore = Math.min(100, logs.length * 10 + (selectedVehicle?.serviceLogs?.length || 0) * 5);
    let badge = null;
    if (ecoScore >= 80) badge = { label: 'Eco Champion 🏆', color: '#004f53' };
    else if (ecoScore >= 50) badge = { label: 'Green Driver 🌿', color: '#1a6b2f' };
    else if (ecoScore >= 20) badge = { label: 'Eco Starter 🌱', color: '#2e7d32' };
    return { totals, ecoScore, badge, logs: [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
  }, [selectedVehicle]);

  const preview = previewCalc(distanceKm, baseEfficiency, improvedEfficiency);

  const handleAdd = async () => {
    const d = parseFloat(distanceKm); const b = parseFloat(baseEfficiency); const i = parseFloat(improvedEfficiency);
    if (!distanceKm || !baseEfficiency || !improvedEfficiency) { Alert.alert('Error', 'Distance and efficiency fields required.'); return; }
    if (isNaN(d) || d <= 0 || isNaN(b) || b <= 0 || isNaN(i) || i <= 0) { Alert.alert('Error', 'Must be positive numbers.'); return; }
    if (i <= b) { Alert.alert('Error', 'Improved efficiency must be greater than base.'); return; }
    if (!selectedVehicle) return;

    try {
      setSaving(true);
      await addEcoLog(selectedVehicle.id, { distanceKm: d, baseEfficiency: b, improvedEfficiency: i, serviceType: serviceType.trim() || 'General Service', note: note.trim() });
      setModalVisible(false);
      setDistanceKm(''); setBaseEfficiency(''); setImprovedEfficiency(''); setServiceType(''); setNote('');
      await loadData(true);
    } catch (err) { Alert.alert('Error', 'Failed to save eco log.'); } finally { setSaving(false); }
  };

  const renderLog = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
      <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm border border-outline-variant/10">
        <View className="flex-row items-start gap-3 flex-1 pr-2">
          <View className="w-10 h-10 rounded-full bg-[#e8f5e9] items-center justify-center">
            <MaterialIcons name="eco" size={18} color="#1a6b2f" />
          </View>
          <View className="flex-1 mt-1">
            <Text className="text-sm font-bold text-on-surface">{item.serviceType}</Text>
            <Text className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold tracking-wider">
              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            {item.note ? <Text className="text-xs text-on-surface-variant mt-2 font-medium italic">{item.note}</Text> : null}
          </View>
        </View>
        <View className="items-end min-w-[70px] bg-[#f0fdf4] px-3 py-2 rounded-xl border border-[#1a6b2f]/10">
          <Text className="text-sm font-extrabold text-[#1a6b2f]">−{item.co2SavedKg} kg</Text>
          <Text className="text-[9px] text-[#2e4a2e] font-bold uppercase tracking-widest mt-1">CO₂ saved</Text>
          <Text className="text-xs mt-2">{item.treesEquivalent} 🌳</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-[#d4edda] items-center justify-center -ml-2">
            <MaterialIcons name="eco" size={20} color="#1a6b2f" />
          </View>
          <Text className="text-xl font-extrabold tracking-tight text-on-surface">Eco Impact</Text>
        </View>
        {ecoStats.badge && (
           <View className="px-3 py-1.5 rounded-full border" style={{ backgroundColor: ecoStats.badge.color + '15', borderColor: ecoStats.badge.color + '40' }}>
               <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ecoStats.badge.color }}>{ecoStats.badge.label}</Text>
           </View>
        )}
      </View>

      {loading && !refreshing ? (
         <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1a6b2f" />
         </View>
      ) : (
        <FlatList
          data={ecoStats.logs}
          keyExtractor={(item, index) => (item.id || item._id || index).toString()}
          renderItem={renderLog}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#1a6b2f" />}
          contentContainerStyle={{ paddingBottom: Math.max(tabBarHeight + 24, 110), paddingHorizontal: 24 }}
          ListHeaderComponent={
            <View className="gap-5 pt-2 mb-6">
              {/* Eco Score */}
              <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-[#f0fdf4] rounded-3xl p-6 shadow-sm border border-[#1a6b2f]/10">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-extrabold text-[#111c2d]">🌍 Eco Score</Text>
                  <Text className="text-3xl font-extrabold text-[#1a6b2f]">{ecoStats.ecoScore}<Text className="text-base text-[#2e4a2e]">/100</Text></Text>
                </View>
                
                {/* Score Bar */}
                <View className="h-3 bg-[#c8e6c9] rounded-full overflow-hidden">
                   <View className="h-3 bg-[#1a6b2f] rounded-full" style={{ width: `${Math.min(100, Math.max(0, ecoStats.ecoScore))}%` }} />
                </View>
                <View className="flex-row justify-between mt-2">
                   <Text className="text-[10px] font-bold text-[#57657a]">0</Text>
                   <Text className="text-[10px] font-bold text-[#57657a]">100</Text>
                </View>

                <Text className="text-xs text-[#2e4a2e] mt-4 leading-5 font-medium">
                  {ecoStats.ecoScore === 0 ? 'Log your first eco entry after a service to start earning points.' : 
                   ecoStats.ecoScore < 50 ? 'Keep servicing on time to climb the eco ladder!' : 
                   'Great work — your vehicle is running clean! 🌿'}
                </Text>
              </Animated.View>

              {/* Stats grid */}
              <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} className="flex-row flex-wrap gap-3">
                <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 items-center shadow-sm border border-outline-variant/10">
                   <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2"><MaterialIcons name="cloud" size={20} color="#0040a1" /></View>
                   <Text className="text-2xl font-extrabold text-on-surface">{ecoStats.totals.co2}</Text>
                   <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">kg CO₂ Saved</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 items-center shadow-sm border border-outline-variant/10">
                   <View className="w-10 h-10 rounded-full bg-[#e8f5e9] items-center justify-center mb-2"><MaterialIcons name="park" size={20} color="#1a6b2f" /></View>
                   <Text className="text-2xl font-extrabold text-on-surface">{ecoStats.totals.trees}</Text>
                   <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">Trees / yr</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 items-center shadow-sm border border-outline-variant/10">
                   <View className="w-10 h-10 rounded-full bg-[#fff3e0] items-center justify-center mb-2"><MaterialIcons name="local-gas-station" size={20} color="#f57c00" /></View>
                   <Text className="text-2xl font-extrabold text-on-surface">{ecoStats.totals.fuel}</Text>
                   <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">L Fuel Saved</Text>
                </View>
                <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 items-center shadow-sm border border-outline-variant/10">
                   <View className="w-10 h-10 rounded-full bg-[#e0f7fa] items-center justify-center mb-2"><MaterialIcons name="route" size={20} color="#00838f" /></View>
                   <Text className="text-2xl font-extrabold text-on-surface">{ecoStats.totals.km}</Text>
                   <Text className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">km Clean Drive</Text>
                </View>
              </Animated.View>

              {/* How it works */}
              <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} className="bg-[#e8f5e9] rounded-2xl p-5 border-l-4 border-l-[#1a6b2f]">
                <Text className="text-sm font-extrabold text-[#1a6b2f] mb-2">🧮 How we calculate this</Text>
                <Text className="text-xs text-[#2e4a2e] leading-5 font-medium">
                  After each service, your engine runs more efficiently. We compare your fuel efficiency before and after servicing over the distance you drove, then convert the fuel saved into CO₂ using the standard petrol factor of <Text className="font-bold">2.31 kg CO₂/L</Text>.
                </Text>
              </Animated.View>

              {ecoStats.logs.length > 0 && <Text className="text-lg font-extrabold text-on-surface mt-4">History</Text>}
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10 bg-surface-container-low rounded-3xl border border-outline-variant/30 px-6">
              <MaterialIcons name="eco" size={48} color="#c3d6c3" />
              <Text className="text-xl font-extrabold text-on-surface mt-4">No eco logs yet</Text>
              <Text className="text-sm text-on-surface-variant text-center mt-2 font-medium leading-5">After your next service, tap + to log the distance and efficiency improvement. We'll calculate exactly how much CO₂ you saved.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Animated.View style={[fabStyle, { position: 'absolute', right: 24, bottom: Math.max(tabBarHeight + 20, 90) }]}>
        <TouchableOpacity
          onPress={() => { fabScale.value = withSpring(0.9, {}, () => { fabScale.value = withSpring(1); }); setModalVisible(true); }}
          activeOpacity={0.85}
          className="w-16 h-16 rounded-full bg-[#1a6b2f] items-center justify-center shadow-lg shadow-[#1a6b2f]/40"
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Add Eco Log Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-on-surface">Log Eco Impact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="close" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Input label="Service Type" placeholder="e.g. Oil Change, Full Service" value={serviceType} onChangeText={setServiceType} />
              <Input label="Distance Driven Since Last Service (km) *" placeholder="1000" keyboardType="numeric" value={distanceKm} onChangeText={setDistanceKm} icon="route" />
              
              <View className="flex-row gap-4">
                 <View className="flex-1"><Input label="Before (km/L) *" placeholder="10.0" keyboardType="numeric" value={baseEfficiency} onChangeText={setBaseEfficiency} /></View>
                 <View className="flex-1"><Input label="After (km/L) *" placeholder="11.5" keyboardType="numeric" value={improvedEfficiency} onChangeText={setImprovedEfficiency} /></View>
              </View>

              <Input label="Note (optional)" placeholder="Any extra details..." value={note} onChangeText={setNote} multiline />

              {/* Live preview */}
              {preview && (
                <View className="bg-[#f0fdf4] rounded-2xl p-4 mt-2 mb-4 border border-[#1a6b2f]/20">
                  <Text className="text-xs font-extrabold text-[#1a6b2f] mb-3 uppercase tracking-wider">✨ Estimated Impact</Text>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-xs text-[#2e4a2e] font-medium">🌿 <Text className="font-bold">{preview.co2Saved} kg</Text> CO₂ saved</Text>
                    <Text className="text-xs text-[#2e4a2e] font-medium">🌳 <Text className="font-bold">{preview.trees}</Text> trees/yr</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-[#2e4a2e] font-medium">⛽ <Text className="font-bold">{preview.fuelSaved} L</Text> fuel saved</Text>
                    <Text className="text-xs text-[#2e4a2e] font-medium">🛣️ <Text className="font-bold">{preview.km} km</Text> clean drive</Text>
                  </View>
                </View>
              )}

              <View className="mt-4 mb-4">
                 <TouchableOpacity onPress={handleAdd} disabled={saving} className="w-full h-[56px] bg-[#1a6b2f] rounded-xl items-center justify-center shadow-md">
                     {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Eco Log</Text>}
                 </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
