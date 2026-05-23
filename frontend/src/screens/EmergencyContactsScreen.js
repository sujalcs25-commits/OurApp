import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { fetchContacts, addContact, updateContact, deleteContact } from '../services/api';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

function ContactRow({ contact, onEdit, onDelete, index }) {
  const initials = contact.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
      <View className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center gap-4 shadow-sm border border-outline-variant/10">
        <View className="w-12 h-12 rounded-full bg-error-container/30 items-center justify-center border border-error/10">
          <Text className="text-error font-extrabold text-base">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-on-surface">{contact.name}</Text>
          <Text className="text-xs text-on-surface-variant mt-1 font-medium">{contact.phone}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => onEdit(contact)} className="w-10 h-10 bg-surface-container rounded-full items-center justify-center">
            <MaterialIcons name="edit" size={20} color="#0040a1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(contact)} className="w-10 h-10 bg-error-container/50 rounded-full items-center justify-center">
            <MaterialIcons name="delete-outline" size={20} color="#ba1a1a" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(data);
    } catch {
      Alert.alert('Error', 'Could not load emergency contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingContact(null); setName(''); setPhone(''); setModalVisible(true); };
  const openEdit = (contact) => { setEditingContact(contact); setName(contact.name); setPhone(contact.phone); setModalVisible(true); };

  const validate = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return false; }
    if (!phone.trim() || !PHONE_RE.test(phone)) { Alert.alert('Error', 'Enter a valid phone number'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      if (editingContact) {
        const updated = await updateContact(editingContact.id, { name: name.trim(), phone });
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await addContact({ name: name.trim(), phone });
        setContacts((prev) => [...prev, created]);
      }
      setModalVisible(false);
    } catch (err) { Alert.alert('Error', err?.response?.data?.msg || 'Failed to save contact.'); } finally { setSaving(false); }
  };

  const handleDelete = (contact) => {
    Alert.alert('Remove Contact', `Remove ${contact.name} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(contact.id);
            setContacts((prev) => prev.filter((c) => c.id !== contact.id));
          } catch { Alert.alert('Error', 'Could not delete contact.'); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center -ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-on-surface">ICE Contacts</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#ba1a1a" /></View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item, index }) => <ContactRow contact={item} index={index} onEdit={openEdit} onDelete={handleDelete} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(600).springify()} className="flex-row items-start gap-3 bg-error-container/20 rounded-2xl p-4 mb-6 border border-error/10">
              <MaterialIcons name="info" size={20} color="#ba1a1a" />
              <Text className="flex-1 text-xs text-on-surface font-medium leading-5">Up to 5 contacts. They will receive an SMS with your live location when you trigger SOS.</Text>
            </Animated.View>
          }
          ListEmptyComponent={
            <View className="items-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/30 mt-4 px-6">
              <MaterialIcons name="contact-emergency" size={64} color="#e0c8c8" />
              <Text className="text-xl font-extrabold text-on-surface mt-6">No contacts yet</Text>
              <Text className="text-sm text-on-surface-variant text-center mt-2 font-medium leading-5">Add trusted people who should be alerted in an emergency.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      {contacts.length < 5 && (
        <Animated.View style={[fabStyle, { position: 'absolute', bottom: 32, right: 24 }]}>
          <TouchableOpacity
            onPress={() => { fabScale.value = withSpring(0.88, {}, () => { fabScale.value = withSpring(1); }); openAdd(); }}
            activeOpacity={0.85}
            className="w-16 h-16 rounded-full bg-error items-center justify-center shadow-xl shadow-error/40"
          >
            <MaterialIcons name="person-add" size={32} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-extrabold text-on-surface">{editingContact ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="close" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            <Input label="Full Name *" placeholder="e.g. Jane Doe" value={name} onChangeText={setName} autoCapitalize="words" icon="person" />
            <Input label="Phone Number *" placeholder="e.g. +91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="phone" />

            <View className="mt-4">
              <TouchableOpacity onPress={handleSave} disabled={saving} className="w-full h-[56px] bg-error rounded-xl items-center justify-center shadow-md">
                 {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">{editingContact ? 'Save Changes' : 'Add Contact'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
