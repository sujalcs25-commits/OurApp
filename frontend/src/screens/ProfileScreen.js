import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProfile, updateProfile, changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

import UniversalAlert from '../utils/alert';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function AvatarInitials({ name, size = 80 }) {
  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View className="bg-primary items-center justify-center shadow-lg shadow-primary/30" style={{ width: size, height: size, borderRadius: size / 2, marginBottom: 14 }}>
      <Text className="text-on-primary font-extrabold" style={{ fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

function MenuRow({ icon, label, hint, onPress, danger = false, last = false }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className={`flex-row items-center px-4 py-4 gap-4 ${!last ? 'border-b border-outline-variant/10' : ''}`}>
      <View className={`w-12 h-12 rounded-full items-center justify-center ${danger ? 'bg-error-container' : 'bg-primary/10'}`}>
        <MaterialIcons name={icon} size={22} color={danger ? '#ba1a1a' : '#0040a1'} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</Text>
        {hint ? <Text className="text-xs text-on-surface-variant mt-1 font-medium">{hint}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={danger ? '#ba1a1a' : '#9aa5b4'} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [user, setUser] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Change password modal
  const [pwVisible, setPwVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProfile();
      setUser({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
      const stored = await AsyncStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem('user', JSON.stringify({ ...parsed, name: data.name, email: data.email }));
    } catch {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const p = JSON.parse(stored);
          setUser({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const openEdit = () => { setEditName(user.name); setEditPhone(user.phone); setEditVisible(true); };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    try {
      setSaving(true);
      const updated = await updateProfile({ name: editName.trim(), phone: editPhone.trim() });
      setUser({ name: updated.name, email: updated.email, phone: updated.phone || '' });
      await AsyncStorage.setItem('user', JSON.stringify({ name: updated.name, email: updated.email }));
      setEditVisible(false);
    } catch (err) { Alert.alert('Error', err?.response?.data?.msg || 'Failed to update profile.'); } finally { setSaving(false); }
  };

  const openChangePassword = () => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwVisible(true); };

  const handleChangePassword = async () => {
    if (!currentPw || newPw.length < 8 || newPw !== confirmPw) { Alert.alert('Error', 'Please check password requirements.'); return; }
    try {
      setChangingPw(true);
      await changePassword(currentPw, newPw);
      setPwVisible(false);
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err) { Alert.alert('Error', err?.response?.data?.msg || 'Failed to change password.'); } finally { setChangingPw(false); }
  };

  const handleLogout = () => {
    UniversalAlert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  if (loading) return <SafeAreaView className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#0040a1" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-on-surface">Profile</Text>
        <TouchableOpacity onPress={openEdit} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -mr-2">
          <MaterialIcons name="edit" size={20} color="#0040a1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        {/* Avatar + info card */}
        <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-surface rounded-3xl p-8 items-center mb-6 shadow-sm border border-outline-variant/20 relative overflow-hidden">
          <View className="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full" />
          <AvatarInitials name={user.name} size={96} />
          <Text className="text-2xl font-extrabold text-on-surface mb-1">{user.name}</Text>
          <Text className="text-sm text-on-surface-variant mb-2 font-medium">{user.email}</Text>
          {user.phone ? (
            <View className="flex-row items-center gap-2 mb-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10">
              <MaterialIcons name="phone" size={14} color="#57657a" />
              <Text className="text-xs text-on-surface-variant font-bold">{user.phone}</Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-2 bg-[#e8f5e9] px-4 py-2 rounded-full mt-2 border border-[#1a6b2f]/20">
            <View className="w-2 h-2 rounded-full bg-[#1a6b2f]" />
            <Text className="text-[10px] font-extrabold text-[#1a6b2f] uppercase tracking-widest">Account Active</Text>
          </View>
        </Animated.View>

        {/* Account section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-2">Account</Text>
            <View className="bg-surface rounded-3xl mb-6 shadow-sm border border-outline-variant/10 overflow-hidden">
              <MenuRow icon="person" label="Edit Profile" hint="Update your name and phone number" onPress={openEdit} />
              <MenuRow icon="lock" label="Change Password" hint="Update your account password" onPress={openChangePassword} />
              <MenuRow icon="directions-car" label="My Garage" hint="View and manage your vehicles" onPress={() => navigation.navigate('MyVehicles')} last />
            </View>
        </Animated.View>

        {/* More section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-2">More</Text>
            <View className="bg-surface rounded-3xl mb-6 shadow-sm border border-outline-variant/10 overflow-hidden">
              <MenuRow icon="folder" label="My Documents" hint="Insurance, registration, and more" onPress={() => navigation.navigate('Documents')} />
              <MenuRow icon="contact-emergency" label="Emergency Contacts" hint="Manage SOS alert contacts" onPress={() => navigation.navigate('EmergencyContacts')} />
              <MenuRow icon="logout" label="Log Out" hint="Sign out of your account" onPress={handleLogout} danger last />
            </View>
        </Animated.View>

        {/* App version */}
        <Text className="text-center text-xs text-on-surface-variant font-medium mt-4">DriveCare v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-extrabold text-on-surface">Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="close" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            <Input label="Full Name *" placeholder="Your full name" autoCapitalize="words" value={editName} onChangeText={setEditName} icon="person" />
            <Input label="Phone Number" placeholder="+91 98765 43210" keyboardType="phone-pad" value={editPhone} onChangeText={setEditPhone} icon="phone" />

            <View className="mb-6 mt-2">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</Text>
              <View className="flex-row items-center bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/20 opacity-70">
                <MaterialIcons name="lock" size={18} color="#9aa5b4" className="mr-3" />
                <Text className="text-base text-on-surface-variant font-medium">{user.email}</Text>
              </View>
              <Text className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest">Email cannot be changed</Text>
            </View>

            <Button title="Save Changes" onPress={handleSaveProfile} loading={saving} icon="save" />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Change Password Modal ──────────────────────────────────────────── */}
      <Modal visible={pwVisible} animationType="slide" transparent onRequestClose={() => setPwVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-extrabold text-on-surface">Change Password</Text>
              <TouchableOpacity onPress={() => setPwVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="close" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            <Input label="Current Password *" placeholder="Enter current password" secureTextEntry autoCapitalize="none" value={currentPw} onChangeText={setCurrentPw} icon="lock-outline" />
            <Input label="New Password *" placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" value={newPw} onChangeText={setNewPw} icon="lock" />
            <Input label="Confirm New Password *" placeholder="Repeat new password" secureTextEntry autoCapitalize="none" value={confirmPw} onChangeText={setConfirmPw} icon="check-circle-outline" />

            <View className="mt-4">
               <Button title="Update Password" onPress={handleChangePassword} loading={changingPw} icon="security" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
