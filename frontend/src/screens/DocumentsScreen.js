import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, RefreshControl, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { fetchVehicles, addDocumentLog, updateDocumentLog, deleteDocumentLog } from '../services/api';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// Load DateTimePicker only on native (crashes on web)
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try { 
    DateTimePicker = require('@react-native-community/datetimepicker').default; 
  } catch (error) {
    console.warn('DateTimePicker not available:', error);
  }
}

const DocumentsScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => { loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await fetchVehicles();
      setVehicles(data);
      
      if (selectedVehicle) {
        const currentId = selectedVehicle.id || selectedVehicle._id;
        const updated = data.find(v => (v.id || v._id) === currentId);
        if (updated) setSelectedVehicle(updated);
        else if (data.length > 0) setSelectedVehicle(data[0]);
      } else if (data.length > 0) {
        setSelectedVehicle(data.find(v => v.isPrimary) || data[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is mandatory.'); return; }
    if (!selectedVehicle) { Alert.alert('Error', 'Select a vehicle.'); return; }

    try {
      setSaving(true);
      const payload = { title: title.trim(), expiryDate };
      const vId = selectedVehicle.id || selectedVehicle._id;

      if (editingDoc) {
        await updateDocumentLog(vId, editingDoc.id || editingDoc._id, payload);
      } else {
        await addDocumentLog(vId, payload);
      }

      setModalVisible(false);
      resetForm();
      await loadData(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to sync document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (docId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to remove this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
             try {
               await deleteDocumentLog(selectedVehicle.id || selectedVehicle._id, docId);
               await loadData(true);
             } catch {
               Alert.alert('Error', 'Delete failed.');
             }
          }
        }
      ]
    );
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setExpiryDate(doc.expiryDate || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingDoc(null);
    setTitle('');
    setExpiryDate('');
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const documents = selectedVehicle?.documents || [];

  const renderHeader = () => (
    <View className="mb-8">
      <View className="flex-row items-center justify-between mb-8">
        <View>
          <Text className="text-4xl font-black text-on-surface tracking-tighter">Vault</Text>
          <Text className="text-on-surface-variant font-bold text-xs uppercase tracking-widest text-[#0040a1]">Document Center</Text>
        </View>
        <TouchableOpacity 
          onPress={() => { resetForm(); setModalVisible(true); }}
          className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30"
        >
          <MaterialIcons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Primary Vehicle Badge */}
      <View className="flex-row items-center gap-3 bg-primary/5 p-4 rounded-3xl border border-primary/10">
         <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
            <MaterialIcons name="directions-car" size={20} color="white" />
         </View>
         <View className="flex-1">
            <Text className="text-on-surface font-bold text-lg">{selectedVehicle?.licensePlate || 'Garage'}</Text>
            <Text className="text-on-surface-variant text-[10px] uppercase font-black">{selectedVehicle?.make} {selectedVehicle?.model}</Text>
         </View>
         <View className="bg-white/50 px-3 py-1 rounded-full border border-outline-variant/20">
            <Text className="text-[10px] font-black text-on-surface-variant">{documents.length} Docs</Text>
         </View>
      </View>
    </View>
  );

  const renderDoc = ({ item: doc, index }) => {
    const expired = isExpired(doc.expiryDate);
    return (
      <Animated.View entering={FadeInUp.delay(index * 50)}>
        <View className="bg-surface rounded-3xl p-5 mb-4 border border-outline-variant/10 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1">
            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${expired ? 'bg-error-container/30' : 'bg-primary/5'}`}>
              <MaterialIcons name="article" size={24} color={expired ? '#ba1a1a' : '#0040a1'} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-on-surface text-lg leading-tight">{doc.title}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                {doc.expiryDate && (
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${expired ? 'text-error' : 'text-on-surface-variant'}`}>
                    {expired ? 'Expired' : 'Expires'}: {new Date(doc.expiryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
             <TouchableOpacity onPress={() => handleEdit(doc)} className="w-10 h-10 bg-surface-container-highest rounded-full items-center justify-center">
                <MaterialIcons name="edit" size={18} color="#0040a1" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleDelete(doc.id || doc._id)} className="w-10 h-10 bg-error-container/20 rounded-full items-center justify-center">
                <MaterialIcons name="delete" size={18} color="#ba1a1a" />
             </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header bar */}
      <View className="flex-row items-center px-6 py-4">
         <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
         </TouchableOpacity>
         <Text className="text-xl font-black text-on-surface tracking-tight">Documents</Text>
      </View>

      {loading && !refreshing ? (
         <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0040a1" />
         </View>
      ) : (
         <FlatList 
           className="px-6 pt-4"
           contentContainerStyle={{ paddingBottom: 40 }}
           data={documents}
           keyExtractor={(item) => (item.id || item._id).toString()}
           renderItem={renderDoc}
           ListHeaderComponent={renderHeader}
           showsVerticalScrollIndicator={false}
           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0040a1" />}
           ListEmptyComponent={
              <View className="items-center justify-center py-20 opacity-30">
                 <MaterialIcons name="folder-zip" size={64} color="#0040a1" />
                 <Text className="font-bold text-sm mt-4">Empty vault. Tap (+) to add docs.</Text>
              </View>
           }
         />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
           <Animated.View entering={FadeInUp} className="bg-surface rounded-t-[40px] p-8 pb-12 shadow-2xl">
              <View className="flex-row justify-between items-center mb-10">
                 <Text className="text-3xl font-black text-on-surface tracking-tighter">{editingDoc ? 'Update' : 'New Doc'}</Text>
                 <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} className="w-12 h-12 bg-surface-container-highest rounded-full items-center justify-center">
                    <MaterialIcons name="close" size={24} color="#111c2d" />
                 </TouchableOpacity>
              </View>

              <Input label="Document Title" placeholder="e.g. Insurance Policy" value={title} onChangeText={setTitle} icon="title" />
              
              <Text className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Expiry Date</Text>
              
              {Platform.OS === 'web' ? (
                // Web: Native HTML date input
                <View className="mb-8">
                  {React.createElement('input', {
                    type: 'date',
                    value: expiryDate || '',
                    onChange: (e) => setExpiryDate(e.target.value),
                    style: {
                      backgroundColor: '#eef0f8',
                      borderRadius: 16,
                      padding: '14px 18px',
                      fontSize: 15,
                      fontWeight: '700',
                      color: expiryDate ? '#111c2d' : '#888',
                      border: '1.5px solid #e2e4f0',
                      outline: 'none',
                      width: '100%',
                      display: 'block',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    },
                  })}
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    className="bg-surface-container-highest rounded-2xl p-5 flex-row items-center gap-4 mb-8 border border-outline-variant/10"
                  >
                     <MaterialIcons name="event" size={24} color="#0040a1" />
                     <Text className="text-on-surface font-bold">
                       {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Set Expiry (Optional)'}
                     </Text>
                  </TouchableOpacity>

                  {showDatePicker && DateTimePicker && (
                     <View className={Platform.OS === 'ios' ? 'bg-surface-container-highest rounded-3xl p-4 mb-4' : ''}>
                        <DateTimePicker
                          value={expiryDate && !isNaN(new Date(expiryDate).getTime()) ? new Date(expiryDate) : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, date) => {
                            if (Platform.OS === 'android') setShowDatePicker(false);
                            if (date) setExpiryDate(date.toISOString().split('T')[0]);
                          }}
                        />
                        {Platform.OS === 'ios' && (
                           <TouchableOpacity 
                             onPress={() => setShowDatePicker(false)} 
                             className="mt-2 items-center py-2 bg-primary rounded-xl"
                           >
                              <Text className="text-white font-bold">Done</Text>
                           </TouchableOpacity>
                        )}
                     </View>
                  )}
                </>
              )}

              <View className="mt-8">
                 <Button title={editingDoc ? 'Update Record' : 'Vault Document'} onPress={handleSaveDocument} loading={saving} icon="save" />
              </View>
           </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
