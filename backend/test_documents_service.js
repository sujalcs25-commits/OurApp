/**
 * Test script for Documents and Service endpoints
 * Run with: node test_documents_service.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let vehicleId = '';

// Test user credentials (use demo user or create one)
const TEST_USER = {
  email: 'demo@drivecare.com',
  password: 'demo123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API helper
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function testLogin() {
  try {
    logInfo('Testing login...');
    const response = await api.post('/auth/login', TEST_USER);
    authToken = response.data.token;
    logSuccess('Login successful');
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

async function testGetVehicles() {
  try {
    logInfo('Fetching vehicles...');
    const response = await api.get('/vehicles');
    const vehicles = response.data;
    
    if (vehicles.length === 0) {
      logWarning('No vehicles found. Please add a vehicle first.');
      return false;
    }
    
    vehicleId = vehicles[0].id || vehicles[0]._id;
    logSuccess(`Found ${vehicles.length} vehicle(s). Using vehicle: ${vehicles[0].make} ${vehicles[0].model}`);
    return true;
  } catch (error) {
    logError(`Failed to fetch vehicles: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

async function testAddDocument() {
  try {
    logInfo('Testing add document...');
    const documentData = {
      title: 'Test Insurance Policy',
      expiryDate: '2025-12-31'
    };
    
    const response = await api.post(`/vehicles/${vehicleId}/documents`, documentData);
    logSuccess(`Document added: ${response.data.documentData.title}`);
    return response.data.documentData.id || response.data.documentData._id;
  } catch (error) {
    logError(`Failed to add document: ${error.response?.data?.msg || error.message}`);
    return null;
  }
}

async function testUpdateDocument(docId) {
  try {
    logInfo('Testing update document...');
    const updateData = {
      title: 'Updated Insurance Policy',
      expiryDate: '2026-06-30'
    };
    
    const response = await api.put(`/vehicles/${vehicleId}/documents/${docId}`, updateData);
    logSuccess(`Document updated: ${response.data.documentData.title}`);
    return true;
  } catch (error) {
    logError(`Failed to update document: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

async function testDeleteDocument(docId) {
  try {
    logInfo('Testing delete document...');
    await api.delete(`/vehicles/${vehicleId}/documents/${docId}`);
    logSuccess('Document deleted successfully');
    return true;
  } catch (error) {
    logError(`Failed to delete document: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

async function testAddService() {
  try {
    logInfo('Testing add service...');
    const serviceData = {
      type: 'Oil Change',
      description: 'Regular maintenance',
      status: 'Upcoming',
      serviceDate: '2025-06-15'
    };
    
    const response = await api.post(`/vehicles/${vehicleId}/service`, serviceData);
    logSuccess(`Service added: ${response.data.serviceData.type}`);
    return response.data.serviceData.id || response.data.serviceData._id;
  } catch (error) {
    logError(`Failed to add service: ${error.response?.data?.msg || error.message}`);
    return null;
  }
}

async function testUpdateService(serviceId) {
  try {
    logInfo('Testing update service...');
    const updateData = {
      status: 'Completed'
    };
    
    const response = await api.put(`/vehicles/${vehicleId}/service/${serviceId}`, updateData);
    logSuccess(`Service updated: ${response.data.serviceData.status}`);
    return true;
  } catch (error) {
    logError(`Failed to update service: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

async function testDeleteService(serviceId) {
  try {
    logInfo('Testing delete service...');
    await api.delete(`/vehicles/${vehicleId}/service/${serviceId}`);
    logSuccess('Service deleted successfully');
    return true;
  } catch (error) {
    logError(`Failed to delete service: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n========================================', 'blue');
  log('  Documents & Service API Tests', 'blue');
  log('========================================\n', 'blue');
  
  logInfo(`Testing API at: ${BASE_URL}\n`);
  
  // Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    logError('Cannot proceed without authentication');
    return;
  }
  
  console.log('');
  
  // Get vehicles
  const vehiclesSuccess = await testGetVehicles();
  if (!vehiclesSuccess) {
    logError('Cannot proceed without a vehicle');
    return;
  }
  
  console.log('');
  log('--- Testing Documents Endpoints ---', 'yellow');
  console.log('');
  
  // Test documents
  const docId = await testAddDocument();
  if (docId) {
    await testUpdateDocument(docId);
    await testDeleteDocument(docId);
  }
  
  console.log('');
  log('--- Testing Service Endpoints ---', 'yellow');
  console.log('');
  
  // Test services
  const serviceId = await testAddService();
  if (serviceId) {
    await testUpdateService(serviceId);
    await testDeleteService(serviceId);
  }
  
  console.log('');
  log('========================================', 'blue');
  log('  All Tests Completed!', 'blue');
  log('========================================\n', 'blue');
}

// Run the tests
runTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});
