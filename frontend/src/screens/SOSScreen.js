import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withSpring, cancelAnimation, FadeInDown } from 'react-native-reanimated';
import { triggerSOS, updateSOSLocation, stopSOS, fetchContacts } from '../services/api';

let Location = null;
try { Location = require('expo-location'); } catch { /* not installed */ }

const COUNTDOWN_SEC = 5;
const LOCATION_INTERVAL_MS = 10000;

function StatusBadge({ status }) {
  const map = {
    idle:      { bg: 'bg-surface/20', color: 'text-white',     label: 'Ready' },
    countdown: { bg: 'bg-[#ffe066]/20',   color: 'text-[#ffe066]',  label: 'Activating…' },
    sending:   { bg: 'bg-[#ffe066]/20',   color: 'text-[#ffe066]',  label: 'Sending Alert…' },
    active:    { bg: 'bg-[#00e676]/20',   color: 'text-[#00e676]',  label: '🔴 SOS Active — Sharing Location' },
    stopping:  { bg: 'bg-surface/20', color: 'text-white',     label: 'Stopping…' },
    error:     { bg: 'bg-[#ff8a80]/20', color: 'text-[#ff8a80]',  label: 'Error — Tap to retry' },
    crash:     { bg: 'bg-[#ba1a1a]/20', color: 'text-[#ba1a1a]',  label: 'CRASH DETECTED!' },
  };
  const c = map[status] || map.idle;
  return (
    <View className={`px-4 py-2 rounded-full mb-8 mt-2 self-center ${c.bg}`}>
      <Text className={`text-xs font-bold uppercase tracking-widest ${c.color}`}>{c.label}</Text>
    </View>
  );
}

// Simulated Sensors if not installed
let Accelerometer = null; 
try { Accelerometer = require('expo-sensors').Accelerometer; } catch { 
  Accelerometer = { addListener: () => ({ remove: () => {} }), setUpdateInterval: () => {} };
}

export default function SOSScreen({ navigation }) {
  const [status, setStatus]           = useState('idle');
  const [countdown, setCountdown]     = useState(COUNTDOWN_SEC);
  const [contacts, setContacts]       = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [lastLocation, setLastLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [smsSent, setSmsSent]         = useState(0);

  const countdownRef   = useRef(null);
  const locationRef    = useRef(null);
  const sosIdRef       = useRef(null);

  const pulseScale  = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const startPulse = useCallback(() => { pulseScale.value = withRepeat(withSequence(withTiming(1.35, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true); }, [pulseScale]);
  const stopPulse = useCallback(() => { cancelAnimation(pulseScale); pulseScale.value = withTiming(1, { duration: 300 }); }, [pulseScale]);

  const pulseStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }], opacity: 1.35 - pulseScale.value }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  useEffect(() => { fetchContacts().then(setContacts).catch(() => {}).finally(() => setLoadingContacts(false)); }, []);
  useEffect(() => { if (status === 'active') startPulse(); else stopPulse(); }, [status, startPulse, stopPulse]);

  // Crash Detection Logic
  useEffect(() => {
    let subscription = null;
    const CRASH_THRESHOLD = 2.5; // G-force
    
    if (Accelerometer) {
      Accelerometer.setUpdateInterval(500);
      subscription = Accelerometer.addListener(data => {
        const acceleration = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        if (acceleration > CRASH_THRESHOLD && status === 'idle') {
          handleCrashDetected();
        }
      });
    }
    return () => {
      subscription?.remove();
      clearInterval(countdownRef.current); 
      clearInterval(locationRef.current); 
    };
  }, [status]);

  const handleCrashDetected = () => {
    setStatus('crash');
    setCountdown(10); // 10s for crash
    let rem = 10;
    countdownRef.current = setInterval(() => {
      rem -= 1;
      setCountdown(rem);
      if (rem <= 0) {
        clearInterval(countdownRef.current);
        activateSOS();
      }
    }, 1000);
  };

  const getLocation = async () => {
    if (!Location) { setLocationError(true); return null; }
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { setLocationError(true); Alert.alert('Location Permission Required', 'Enable location access so your contacts receive your exact position.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Settings', onPress: () => Linking.openSettings() }]); return null; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationError(false);
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch { setLocationError(true); return null; }
  };

  const startCountdown = () => {
    if (status !== 'idle' && status !== 'error') return;
    buttonScale.value = withSpring(0.92, {}, () => { buttonScale.value = withSpring(1); });
    setStatus('countdown'); setCountdown(COUNTDOWN_SEC);
    let rem = COUNTDOWN_SEC;
    countdownRef.current = setInterval(() => { rem -= 1; setCountdown(rem); if (rem <= 0) { clearInterval(countdownRef.current); activateSOS(); } }, 1000);
  };

  const cancelCountdown = () => { clearInterval(countdownRef.current); setStatus('idle'); setCountdown(COUNTDOWN_SEC); };

  const activateSOS = async () => {
    setStatus('sending');
    const loc = await getLocation();
    const lat = loc?.lat ?? 0; const lng = loc?.lng ?? 0;
    if (loc) setLastLocation(loc);
    try {
      const result = await triggerSOS(lat, lng);
      sosIdRef.current = result.sosLog.id; setSmsSent(result.smsSent || 0); setStatus('active');
      locationRef.current = setInterval(async () => {
        const updated = await getLocation();
        if (updated && sosIdRef.current) { setLastLocation(updated); try { await updateSOSLocation(sosIdRef.current, updated.lat, updated.lng); } catch { /* retry next tick */ } }
      }, LOCATION_INTERVAL_MS);
    } catch (err) { setStatus('error'); Alert.alert('SOS Failed', err?.response?.data?.msg || 'Could not send SOS. Check your connection and try again.'); }
  };

  const handleStop = () => {
    Alert.alert('Stop SOS?', 'This will stop sharing your location with emergency contacts.', [
      { text: 'Keep Active', style: 'cancel' },
      { text: 'Stop SOS', style: 'destructive', onPress: async () => { clearInterval(locationRef.current); setStatus('stopping'); try { if (sosIdRef.current) await stopSOS(sosIdRef.current); } catch { /* best-effort */ } sosIdRef.current = null; setStatus('idle'); setSmsSent(0); } },
    ]);
  };

  const openMaps = () => { if (lastLocation) Linking.openURL(`https://maps.google.com/?q=${lastLocation.lat},${lastLocation.lng}`); };

  const isActive = status === 'active'; const isCountdown = status === 'countdown'; const isBusy = status === 'sending' || status === 'stopping';

  return (
    <SafeAreaView className="flex-1 bg-[#ba1a1a]" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => { if (isActive) { Alert.alert('SOS is Active', 'Stop SOS before leaving.'); return; } if (isCountdown) cancelCountdown(); navigation.goBack(); }} className="w-10 h-10 items-center justify-center bg-white/10 rounded-full">
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-white">Emergency Assist</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EmergencyContacts')} className="w-10 h-10 items-center justify-center bg-white/10 rounded-full">
          <MaterialIcons name="contacts" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <StatusBadge status={status} />

        {/* SOS button */}
        <View className="w-56 h-56 items-center justify-center mb-8">
          <Animated.View className={`absolute w-56 h-56 rounded-full ${status === 'crash' ? 'bg-[#ba1a1a]/30' : 'bg-white/30'}`} style={pulseStyle} />
          {(isCountdown || status === 'crash') && (
            <View className="absolute w-56 h-56 rounded-full border-[6px] border-[#ffe066]/70 items-center justify-center">
              <Text className={`text-7xl font-black ${status === 'crash' ? 'text-white' : 'text-[#ffe066]'}`}>{countdown}</Text>
            </View>
          )}
          <Animated.View style={btnStyle}>
            <TouchableOpacity
              onPress={isActive ? handleStop : (isCountdown || status === 'crash') ? cancelCountdown : startCountdown} disabled={isBusy} activeOpacity={0.85}
              className={`w-40 h-40 rounded-full items-center justify-center shadow-xl shadow-black/50 ${isActive ? 'bg-[#7a0000]' : (isCountdown || status === 'crash') ? 'bg-[#fff3cd]' : isBusy ? 'bg-[#e0e0e0]' : 'bg-white'}`}
            >
              {isBusy ? ( <ActivityIndicator size="large" color={isActive ? '#fff' : '#ba1a1a'} /> ) : isActive ? (
                <>
                  <MaterialIcons name="stop" size={48} color="#fff" />
                  <Text className="text-sm font-black text-white tracking-widest mt-1">STOP</Text>
                </>
              ) : (isCountdown || status === 'crash') ? (
                <>
                  <MaterialIcons name="close" size={40} color="#ba1a1a" />
                  <Text className="text-xs font-black text-[#ba1a1a] tracking-widest mt-1">CANCEL</Text>
                </>
              ) : (
                <MaterialIcons name="sos" size={64} color="#ba1a1a" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Instruction */}
        <Text className="text-2xl font-extrabold text-white text-center mb-2">
          {status === 'crash' ? '⚠️ CRASH DETECTED!' : isActive ? '🔴 SOS Active' : isCountdown ? `Sending in ${countdown}s — tap to cancel` : isBusy ? 'Please wait…' : 'Tap to activate SOS'}
        </Text>
        <Text className="text-sm text-white/80 text-center leading-6 mb-8 font-medium px-4">
          {status === 'crash' ? 'We detected a sudden impact. Sending SOS alert automatically unless you cancel.' : isActive ? `Location shared every 10 s.\n${smsSent} contact${smsSent !== 1 ? 's' : ''} notified via SMS.` : isCountdown ? '5-second delay prevents accidental triggers.' : 'Your emergency contacts will receive an SMS with your live GPS location.'}
        </Text>

        {/* Live location card */}
        {(isActive || lastLocation) && (
          <Animated.View entering={FadeInDown.springify()} className="w-full">
            <TouchableOpacity onPress={openMaps} activeOpacity={0.8} className="w-full bg-white/10 rounded-2xl p-4 flex-row items-center justify-between mb-4 border border-white/20">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"><MaterialIcons name="location-on" size={20} color="#fff" /></View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white mb-1">Live Location</Text>
                  <Text className="text-xs text-white/70 font-mono">{lastLocation ? `${lastLocation.lat.toFixed(5)}, ${lastLocation.lng.toFixed(5)}` : 'Acquiring GPS…'}</Text>
                </View>
              </View>
              <MaterialIcons name="open-in-new" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* GPS warning */}
        {locationError && (
          <Animated.View entering={FadeInDown.springify()} className="w-full bg-[#fff3cd] rounded-2xl p-4 flex-row items-start gap-3 mb-4">
            <MaterialIcons name="location-off" size={20} color="#7a4f00" />
            <Text className="flex-1 text-xs text-[#7a4f00] leading-5 font-medium">GPS unavailable. SOS sent without location. Enable location permissions for full functionality.</Text>
          </Animated.View>
        )}

        {/* Contacts */}
        <View className="w-full mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-extrabold text-white">Emergency Contacts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmergencyContacts')} className="bg-white/20 px-3 py-1.5 rounded-full"><Text className="text-xs font-bold text-white">Manage</Text></TouchableOpacity>
          </View>
          {loadingContacts ? (
            <ActivityIndicator color="#fff" className="my-4" />
          ) : contacts.length === 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('EmergencyContacts')} activeOpacity={0.8} className="bg-white/10 rounded-2xl p-5 flex-row items-center gap-4 border border-white/20">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center"><MaterialIcons name="person-add" size={24} color="#fff" /></View>
              <Text className="flex-1 text-xs text-white/80 leading-5 font-medium">No contacts added. Tap to add someone who should be alerted in an emergency.</Text>
            </TouchableOpacity>
          ) : (
            contacts.map((c, idx) => (
              <Animated.View entering={FadeInDown.delay(idx*100).springify()} key={c.id}>
                <View className="flex-row items-center gap-4 bg-white/10 rounded-2xl p-4 mb-3 border border-white/10">
                  <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    <Text className="text-sm font-extrabold text-white">{c.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-white mb-1">{c.name}</Text>
                    <Text className="text-xs text-white/70 font-medium">{c.phone}</Text>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* Quick actions */}
        <View className="w-full mb-4">
          <Text className="text-base font-extrabold text-white mb-4">Quick Actions</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:112')} activeOpacity={0.8} className="flex-row items-center gap-4 bg-white/10 rounded-2xl p-4 mb-3 border border-white/10">
            <View className="w-12 h-12 rounded-full bg-white items-center justify-center"><MaterialIcons name="local-police" size={24} color="#0040a1" /></View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white mb-1">Call Emergency Services</Text>
              <Text className="text-xs text-white/70 font-medium">Dial 112 — National emergency number</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
