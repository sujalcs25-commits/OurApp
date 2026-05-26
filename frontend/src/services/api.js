import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Dynamic API URL Configuration ───────────────────────────────────────────
// Priority:
// 1. User-configured URL from AsyncStorage (set in app settings)
// 2. Environment variable EXPO_PUBLIC_API_URL
// 3. Default cloud URL (works from anywhere)

// Backend deployed on Render
const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://drive-care.onrender.com/api';

let BASE_URL = DEFAULT_BASE_URL;

// Load custom API URL from storage on app start
AsyncStorage.getItem('customApiUrl').then((url) => {
  if (url) {
    BASE_URL = url;
    api.defaults.baseURL = url;
    console.log('[API] Using custom URL:', url);
  }
}).catch(() => {});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15-second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── API URL Management ───────────────────────────────────────────────────────
export const setApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem('customApiUrl', url);
    BASE_URL = url;
    api.defaults.baseURL = url;
    console.log('[API] Updated URL to:', url);
    return true;
  } catch (err) {
    console.error('[API] Failed to save URL:', err.message);
    return false;
  }
};

export const getApiUrl = () => BASE_URL;

export const resetApiUrl = async () => {
  try {
    await AsyncStorage.removeItem('customApiUrl');
    BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;
    api.defaults.baseURL = BASE_URL;
    console.log('[API] Reset to default URL:', BASE_URL);
    return true;
  } catch (err) {
    console.error('[API] Failed to reset URL:', err.message);
    return false;
  }
};

// ─── Test API Connection ──────────────────────────────────────────────────────
export const testApiConnection = async (url) => {
  try {
    const testUrl = url || BASE_URL;
    const response = await axios.get(testUrl.replace('/api', ''), { timeout: 5000 });
    return { success: true, data: response.data };
  } catch (err) {
    return { 
      success: false, 
      error: err.message,
      details: err.response?.data || 'Network error - check URL and internet connection'
    };
  }
};

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle expired / invalid tokens globally ──────────
let logoutCallback = null;

api.setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage so the app re-routes to Login
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch { /* best-effort */ }
      if (logoutCallback) {
        logoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const fetchVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const fetchVehicle = async (vehicleId) => {
  const response = await api.get(`/vehicles/${vehicleId}`);
  return response.data;
};

export const addFuelLog = async (vehicleId, fuelData) => {
  const response = await api.post(`/vehicles/${vehicleId}/fuel`, fuelData);
  return response.data;
};

export const updateFuelLog = async (vehicleId, fuelId, fuelData) => {
  const response = await api.put(`/vehicles/${vehicleId}/fuel/${fuelId}`, fuelData);
  return response.data;
};

export const deleteFuelLog = async (vehicleId, fuelId) => {
  const response = await api.delete(`/vehicles/${vehicleId}/fuel/${fuelId}`);
  return response.data;
};

export const addServiceLog = async (vehicleId, serviceData) => {
  const response = await api.post(`/vehicles/${vehicleId}/service`, serviceData);
  return response.data;
};

export const updateServiceLog = async (vehicleId, serviceId, serviceData) => {
  const response = await api.put(`/vehicles/${vehicleId}/service/${serviceId}`, serviceData);
  return response.data;
};

export const deleteServiceLog = async (vehicleId, serviceId) => {
  const response = await api.delete(`/vehicles/${vehicleId}/service/${serviceId}`);
  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (vehicleId) => {
  const response = await api.delete(`/vehicles/${vehicleId}`);
  return response.data;
};

export const setPrimaryVehicle = async (vehicleId) => {
  const response = await api.post(`/vehicles/${vehicleId}/primary`);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/profile/password', { currentPassword, newPassword });
  return response.data;
};

export const addDocumentLog = async (vehicleId, documentData) => {
  const response = await api.post(`/vehicles/${vehicleId}/documents`, documentData);
  return response.data;
};

export const updateDocumentLog = async (vehicleId, docId, documentData) => {
  const response = await api.put(`/vehicles/${vehicleId}/documents/${docId}`, documentData);
  return response.data;
};

export const deleteDocumentLog = async (vehicleId, docId) => {
  const response = await api.delete(`/vehicles/${vehicleId}/documents/${docId}`);
  return response.data;
};

export const addEcoLog = async (vehicleId, ecoData) => {
  const response = await api.post(`/vehicles/${vehicleId}/eco`, ecoData);
  return response.data;
};

export const fetchEcoSummary = async (vehicleId) => {
  const response = await api.get(`/vehicles/${vehicleId}/eco`);
  return response.data;
};

// ─── SOS ─────────────────────────────────────────────────────────────────────

export const fetchContacts = async () => {
  const response = await api.get('/sos/contacts');
  return response.data;
};

export const addContact = async (contactData) => {
  const response = await api.post('/sos/contacts', contactData);
  return response.data;
};

export const updateContact = async (contactId, contactData) => {
  const response = await api.put(`/sos/contacts/${contactId}`, contactData);
  return response.data;
};

export const deleteContact = async (contactId) => {
  const response = await api.delete(`/sos/contacts/${contactId}`);
  return response.data;
};

export const triggerSOS = async (lat, lng) => {
  const response = await api.post('/sos/trigger', { lat, lng });
  return response.data;
};

export const updateSOSLocation = async (sosId, lat, lng) => {
  const response = await api.post(`/sos/${sosId}/location`, { lat, lng });
  return response.data;
};

export const stopSOS = async (sosId) => {
  const response = await api.post(`/sos/${sosId}/stop`);
  return response.data;
};

export const fetchSOSHistory = async () => {
  const response = await api.get('/sos/history');
  return response.data;
};

export default api;
