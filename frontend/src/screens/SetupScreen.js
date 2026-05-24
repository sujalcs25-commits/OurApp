import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalAlert from '../utils/alert';
import { setApiUrl, testApiConnection } from '../services/api';

export default function SetupScreen({ navigation }) {
  const [apiUrl, setApiUrlState] = useState('http://192.168.1.145:5000/api');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      UniversalAlert.alert('Error', 'Please enter a backend URL');
      return;
    }

    setTesting(true);
    const result = await testApiConnection(apiUrl);
    setTesting(false);

    if (result.success) {
      UniversalAlert.alert(
        'Connection Successful! ✅',
        'Backend server is reachable. You can now save this URL and start using the app.',
        [
          {
            text: 'Save & Continue',
            onPress: handleSave,
          },
        ]
      );
    } else {
      UniversalAlert.alert(
        'Connection Failed ❌',
        `Error: ${result.error}\n\nPlease check:\n• URL is correct\n• Backend server is running\n• You have internet connection`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      UniversalAlert.alert('Error', 'Please enter a backend URL');
      return;
    }

    setSaving(true);
    await setApiUrl(apiUrl);
    await AsyncStorage.setItem('setupCompleted', 'true');
    setSaving(false);
    
    // Navigate to Login
    navigation.replace('Login');
  };

  const handleSkip = async () => {
    UniversalAlert.alert(
      'Skip Setup?',
      'You can configure the backend URL later in Settings. The app may not work until configured.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await AsyncStorage.setItem('setupCompleted', 'true');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="directions-car" size={48} color="#0040a1" />
          </View>
          <Text style={styles.title}>Welcome to DriveCare!</Text>
          <Text style={styles.subtitle}>Let's set up your backend connection</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#0040a1" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Backend Configuration Required</Text>
            <Text style={styles.infoText}>
              DriveCare needs to connect to a backend server. Enter your backend URL below to get started.
            </Text>
          </View>
        </View>

        {/* URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="http://your-server.com:5000/api"
            placeholderTextColor="#9aa5b4"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Example: http://192.168.1.10:5000/api
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.buttonTest]}
          onPress={handleTest}
          disabled={testing || !apiUrl.trim()}
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
          disabled={saving || !apiUrl.trim()}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.buttonSaveText}>Save & Continue</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSkip]}
          onPress={handleSkip}
        >
          <Text style={styles.buttonSkipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📝 How to find your backend URL:</Text>
          
          <Text style={styles.instructionStep}>If backend is on your computer:</Text>
          <Text style={styles.instructionText}>
            1. Find your computer's IP address{'\n'}
            2. Windows: Run "ipconfig" in Command Prompt{'\n'}
            3. Mac/Linux: Run "ifconfig" in Terminal{'\n'}
            4. Use: http://YOUR_IP:5000/api
          </Text>

          <Text style={styles.instructionStep}>If backend is deployed:</Text>
          <Text style={styles.instructionText}>
            Use your deployment URL:{'\n'}
            Example: https://drivecare.railway.app/api
          </Text>

          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={16} color="#b45309" />
            <Text style={styles.warningText}>
              Make sure your backend server is running and accessible!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9ff' },
  scroll: { padding: 16, paddingBottom: 48 },

  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e8eeff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111c2d', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#57657a', textAlign: 'center' },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8eeff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#0040a1',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0040a1', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#2a3a5c', lineHeight: 18 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#424654', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#111c2d',
    borderWidth: 1,
    borderColor: '#d8e3fb',
    fontFamily: 'monospace',
  },
  hint: { fontSize: 11, color: '#9aa5b4', marginTop: 6, fontStyle: 'italic' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  buttonTest: { backgroundColor: '#f0f3ff', borderWidth: 1, borderColor: '#0040a1' },
  buttonTestText: { fontSize: 15, fontWeight: '700', color: '#0040a1' },
  buttonSave: { backgroundColor: '#0040a1' },
  buttonSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  buttonSkip: { backgroundColor: 'transparent' },
  buttonSkipText: { fontSize: 14, fontWeight: '600', color: '#57657a' },

  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e4f0',
  },
  instructionsTitle: { fontSize: 15, fontWeight: '800', color: '#111c2d', marginBottom: 12 },
  instructionStep: { fontSize: 13, fontWeight: '700', color: '#0040a1', marginTop: 12, marginBottom: 4 },
  instructionText: { fontSize: 12, color: '#424654', lineHeight: 18 },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#b45309',
  },
  warningText: { flex: 1, fontSize: 11, color: '#7a4f00', lineHeight: 16 },
});
