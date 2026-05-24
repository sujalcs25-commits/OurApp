/**
 * Fallsback Database Manager — DriveCare
 * 
 * Provides synchronous-like CRUD operations on the local store.json,
 * used when MongoDB is unavailable.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const storePath = path.join(__dirname, '../data/store.json');
const defaultStore = { users: [], vehicles: [], sosLogs: [] };

let store = { ...defaultStore };

// Initialize: synchronous read to ensure data is available for imports
function loadSync() {
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8');
      store = JSON.parse(raw);
    } else {
      saveSync();
    }
  } catch (err) {
    console.error('[FallbackDB] Failed to load store:', err.message);
  }
}

function saveSync() {
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[FallbackDB] Failed to save store:', err.message);
  }
}

loadSync();

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = {
  // ─── User Ops ───────────────────────────────────────────────────────────────
  findUser: (query) => {
    return store.users.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
  },

  createUser: (data) => {
    const newUser = {
      _id: generateId(),
      ...data,
      emergencyContacts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.users.push(newUser);
    saveSync();
    return newUser;
  },

  updateUser: (id, updates) => {
    const idx = store.users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...updates, updatedAt: new Date() };
    saveSync();
    return store.users[idx];
  },

  // ─── Vehicle Ops ────────────────────────────────────────────────────────────
  findVehicles: (query) => {
    return store.vehicles.filter(v => {
      for (let key in query) {
        if (v[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findVehicle: (query) => {
    return store.vehicles.find(v => {
      for (let key in query) {
        if (v[key] !== query[key]) return false;
      }
      return true;
    });
  },

  createVehicle: (data) => {
    const newVehicle = {
      _id: generateId(),
      ...data,
      fuelLogs: [],
      serviceLogs: [],
      documents: [],
      ecoLogs: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.vehicles.push(newVehicle);
    saveSync();
    return newVehicle;
  },

  updateVehicle: (id, updates) => {
    const idx = store.vehicles.findIndex(v => v._id === id);
    if (idx === -1) return null;

    // Deep merge or process nested arrays to add IDs and timestamps
    const v = { ...store.vehicles[idx], ...updates, updatedAt: new Date() };

    ['fuelLogs', 'serviceLogs', 'documents', 'ecoLogs'].forEach(key => {
      if (Array.isArray(v[key])) {
        v[key] = v[key].map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              _id: item._id || generateId(),
              createdAt: item.createdAt || new Date(),
              updatedAt: new Date(),
              ...item
            };
          }
          return item;
        });
      }
    });

    store.vehicles[idx] = v;
    saveSync();
    return store.vehicles[idx];
  },

  deleteVehicle: (id) => {
    store.vehicles = store.vehicles.filter(v => v._id !== id);
    saveSync();
    return true;
  },

  // ─── SOS Ops ────────────────────────────────────────────────────────────────
  findSosLogs: (query) => {
    return store.sosLogs.filter(l => {
      for (let key in query) {
        if (l[key] !== query[key]) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  createSosLog: (data) => {
    const newLog = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.sosLogs.push(newLog);
    saveSync();
    return newLog;
  },

  updateSosLog: (id, updates) => {
    const idx = store.sosLogs.findIndex(l => l._id === id);
    if (idx === -1) return null;
    store.sosLogs[idx] = { ...store.sosLogs[idx], ...updates, updatedAt: new Date() };
    saveSync();
    return store.sosLogs[idx];
  }
};
