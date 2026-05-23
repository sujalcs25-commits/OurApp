/**
 * AppNavigator — DriveCare
 *
 * Uses AuthContext to decide which stack to render.
 * When isAuthenticated flips to false (logout or 401), React automatically
 * unmounts the app stack and mounts the auth stack — no navigation.replace()
 * calls needed anywhere in the app.
 */

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';

import SetupScreen            from '../screens/SetupScreen';
import LoginScreen            from '../screens/LoginScreen';
import SignupStep1Screen      from '../screens/SignupStep1Screen';
import SignupStep2Screen      from '../screens/SignupStep2Screen';
import SignupStep3Screen      from '../screens/SignupStep3Screen';
import HomeScreen             from '../screens/HomeScreen';
import FuelTrackerScreen      from '../screens/FuelTrackerScreen';
import ServiceRemindersScreen from '../screens/ServiceRemindersScreen';
import VehicleHealthScreen    from '../screens/VehicleHealthScreen';
import EcoImpactScreen        from '../screens/EcoImpactScreen';
import MyVehiclesScreen       from '../screens/MyVehiclesScreen';
import DocumentsScreen        from '../screens/DocumentsScreen';
import SOSScreen              from '../screens/SOSScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import SettingsScreen         from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Bottom tab navigator (only shown when authenticated) ─────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#f0f3ff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 10,
        },
        tabBarActiveTintColor: '#0040a1',
        tabBarInactiveTintColor: '#57657a',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Garage"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Fuel"
        component={FuelTrackerScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="local-gas-station" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceRemindersScreen}
        options={{
          tabBarLabel: 'Care',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="build" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Health"
        component={VehicleHealthScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="analytics" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Eco"
        component={EcoImpactScreen}
        options={{
          tabBarLabel: 'Eco',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="eco" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Auth stack (unauthenticated users) ───────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"       component={LoginScreen} />
      <Stack.Screen name="SignupStep1" component={SignupStep1Screen} />
      <Stack.Screen name="SignupStep2" component={SignupStep2Screen} />
      <Stack.Screen name="SignupStep3" component={SignupStep3Screen} />
    </Stack.Navigator>
  );
}

// ─── App stack (authenticated users) ─────────────────────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"          component={MainTabs} />
      <Stack.Screen name="MyVehicles"        component={MyVehiclesScreen} />
      <Stack.Screen name="Documents"         component={DocumentsScreen} />
      <Stack.Screen name="Profile"           component={ProfileScreen} />
      <Stack.Screen name="Settings"          component={SettingsScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="SOS"               component={SOSScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

// ─── Auth stack with Settings (for unauthenticated users) ────────────────────
function AuthStackWithSettings() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup"       component={SetupScreen} />
      <Stack.Screen name="Login"       component={LoginScreen} />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
      <Stack.Screen name="SignupStep1" component={SignupStep1Screen} />
      <Stack.Screen name="SignupStep2" component={SignupStep2Screen} />
      <Stack.Screen name="SignupStep3" component={SignupStep3Screen} />
    </Stack.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const setupCompleted = await AsyncStorage.getItem('setupCompleted');
        setIsFirstLaunch(setupCompleted === null);
      } catch {
        setIsFirstLaunch(false);
      }
    }
    checkFirstLaunch();
  }, []);

  if (isBootstrapping || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9ff' }}>
        <ActivityIndicator size="large" color="#0040a1" />
      </View>
    );
  }

  // React Navigation automatically animates between stacks when
  // isAuthenticated changes — no manual navigation calls needed.
  return isAuthenticated ? <AppStack /> : <AuthStackWithSettings />;
}
