import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getApiUrl, setApiUrl, resetApiUrl, testApiConnection } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const [apiUrl, setApiUrlState] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    setApiUrlState(getApiUrl());
  }, []);

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter an API URL');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    const result = await testApiConnection(apiUrl);
    
    setTesting(false);
    setConnectionStatus(result);

    if (result.success) {
      Alert.alert(
        'Connection Successful! ✅',
        `Server: ${result.data?.message || 'Connected'}\n\nYou can now save this URL.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Connection Failed ❌',
        `Error: ${result.error}\n\n${result.details}\n\nPlease check:\n• URL is correct\n• Backend server is running\n• You have internet connection`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter an API URL');
      return;
    }

    if (!connectionStatus?.success) {
      Alert.alert(
        'Warning',
        'Connection test failed. Save anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            onPress: async () => {
              setSaving(true);
              await setApiUrl(apiUrl);
              setSaving(false);
              Alert.alert('Success', 'API URL saved! Restart the app for changes to take effect.');
            },
          },
        ]
      );
      return;
    }

    setSaving(true);
    await setApiUrl(apiUrl);
    setSaving(false);
    Alert.alert('Success', 'API URL saved! Restart the app for changes to take effect.');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Default',
      'This will reset the API URL to localhost. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetApiUrl();
            setApiUrlState(getApiUrl());
            setConnectionStatus(null);
            Alert.alert('Reset', 'API URL reset to default. Restart the app.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0040a1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>API Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#0040a1" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Configure Backend URL</Text>
            <Text style={styles.infoText}>
              Set your backend server URL to use the app from anywhere. The URL should point to your deployed backend or your computer's IP address.
            </Text>
          </View>
        </View>

        {/* Current URL */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current API URL</Text>
          <View style={styles.currentUrlBox}>
            <MaterialIcons name="link" size={18} color="#0040a1" />
            <Text style={styles.currentUrlText}>{getApiUrl()}</Text>
          </View>
        </View>

        {/* URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>New API URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="http://your-ip:5000/api"
            placeholderTextColor="#9aa5b4"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Example: http://192.168.1.100:5000/api
          </Text>
        </View>

        {/* Connection Status */}
        {connectionStatus && (
          <View style={[
            styles.statusCard,
            connectionStatus.success ? styles.statusSuccess : styles.statusError
          ]}>
            <MaterialIcons 
              name={connectionStatus.success ? 'check-circle' : 'error'} 
              size={20} 
              color={connectionStatus.success ? '#1a6b2f' : '#ba1a1a'} 
            />
            <Text style={[
              styles.statusText,
              connectionStatus.success ? styles.statusTextSuccess : styles.statusTextError
            ]}>
              {connectionStatus.success 
                ? '✓ Connection successful!' 
                : `✗ ${connectionStatus.error}`}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.buttonTest]}
          onPress={handleTest}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#0040a1" />
          ) : (
            <>
              <MaterialIcons name="wifi-tethering" size={20} color="#0040a1" />
              <Text style={styles.buttonTestText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSave]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.buttonSaveText}>Save URL</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonReset]}
          onPress={handleReset}
        >
          <MaterialIcons name="refresh" size={20} color="#ba1a1a" />
          <Text style={styles.buttonResetText}>Reset to Default</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📝 How to find your IP address:</Text>
          
          <Text style={styles.instructionStep}>Windows:</Text>
          <Text style={styles.instructionText}>
            1. Open Command Prompt{'\n'}
            2. Type: ipconfig{'\n'}
            3. Look for "IPv4 Address"
          </Text>

          <Text style={styles.instructionStep}>Mac/Linux:</Text>
          <Text style={styles.instructionText}>
            1. Open Terminal{'\n'}
            2. Type: ifconfig{'\n'}
            3. Look for "inet" address
          </Text>

          <Text style={styles.instructionStep}>Then use:</Text>
          <Text style={styles.instructionText}>
            http://YOUR_IP:5000/api{'\n'}
            Example: http://192.168.1.100:5000/api
          </Text>

          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={16} color="#b45309" />
            <Text style={styles.warningText}>
              Make sure your phone and computer are on the same WiFi network!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9ff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eef0f8',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111c2d' },

  scroll: { padding: 16, paddingBottom: 48 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#e8eeff', borderRadius: 14, padding: 14,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#0040a1',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0040a1', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#2a3a5c', lineHeight: 18 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#424654', marginBottom: 8 },

  currentUrlBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f0f3ff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#d8e3fb',
  },
  currentUrlText: { flex: 1, fontSize: 13, color: '#111c2d', fontFamily: 'monospace' },

  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, color: '#111c2d', borderWidth: 1, borderColor: '#d8e3fb',
    fontFamily: 'monospace',
  },
  hint: { fontSize: 11, color: '#9aa5b4', marginTop: 6, fontStyle: 'italic' },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  statusSuccess: { backgroundColor: '#d4edda', borderWidth: 1, borderColor: '#1a6b2f' },
  statusError: { backgroundColor: '#ffdad6', borderWidth: 1, borderColor: '#ba1a1a' },
  statusText: { flex: 1, fontSize: 13, fontWeight: '600' },
  statusTextSuccess: { color: '#1a6b2f' },
  statusTextError: { color: '#ba1a1a' },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginBottom: 12,
  },
  buttonTest: { backgroundColor: '#f0f3ff', borderWidth: 1, borderColor: '#0040a1' },
  buttonTestText: { fontSize: 15, fontWeight: '700', color: '#0040a1' },
  buttonSave: { backgroundColor: '#0040a1' },
  buttonSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  buttonReset: { backgroundColor: '#ffdad6', borderWidth: 1, borderColor: '#ba1a1a' },
  buttonResetText: { fontSize: 15, fontWeight: '700', color: '#ba1a1a' },

  instructionsCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginTop: 8, borderWidth: 1, borderColor: '#e0e4f0',
  },
  instructionsTitle: { fontSize: 15, fontWeight: '800', color: '#111c2d', marginBottom: 12 },
  instructionStep: { fontSize: 13, fontWeight: '700', color: '#0040a1', marginTop: 12, marginBottom: 4 },
  instructionText: { fontSize: 12, color: '#424654', lineHeight: 18, fontFamily: 'monospace' },

  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fff3cd', borderRadius: 10, padding: 10,
    marginTop: 12, borderWidth: 1, borderColor: '#b45309',
  },
  warningText: { flex: 1, fontSize: 11, color: '#7a4f00', lineHeight: 16 },
});
