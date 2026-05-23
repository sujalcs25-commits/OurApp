/**
 * MongoDB connection — DriveCare
 * Falls back to JSON file storage if MongoDB is unavailable
 */
const mongoose = require('mongoose');
const dns = require('dns');

// Fix for ESERVFAIL on some networks (like Windows with certain ISPs)
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

let useFallback = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[DB] MONGODB_URI not set — using fallback JSON storage');
    useFallback = true;
    return;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName: 'drivecare',
    });
    console.log('[DB] ✓ MongoDB connected — drivecare');
  } catch (err) {
    console.error('[DB] ❌ MongoDB connection error:', err.message);
    console.warn('[DB] ⚠ Using fallback JSON file storage');
    useFallback = true;
  }

  if (!useFallback) {
    mongoose.connection.on('disconnected', () =>
      console.warn('[DB] MongoDB disconnected — will retry automatically')
    );
    mongoose.connection.on('error', (err) =>
      console.error('[DB] MongoDB error:', err.message)
    );
  }
}

function isFallbackMode() {
  return useFallback;
}

module.exports = connectDB;
module.exports.isFallbackMode = isFallbackMode;
