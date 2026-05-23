/**
 * migrate-json-to-mongodb.js
 * ──────────────────────────
 * One-time migration: reads store.json and inserts all users, vehicles,
 * and SOS logs into MongoDB Atlas.
 *
 * Usage:
 *   node backend/scripts/migrate-json-to-mongodb.js
 *
 * Safe to run multiple times — skips users/vehicles that already exist
 * (matched by email for users, by original JSON id stored in legacyId for vehicles).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const fs       = require('fs/promises');
const path     = require('path');

const User    = require('../models/User');
const Vehicle = require('../models/Vehicle');
const SosLog  = require('../models/SosLog');

const STORE_PATH = path.join(__dirname, '../data/store.json');

async function migrate() {
  // ── Connect ──────────────────────────────────────────────────────────────
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri, { dbName: 'drivecare' });
  console.log('✅ Connected to MongoDB — drivecare\n');

  // ── Read store.json ───────────────────────────────────────────────────────
  let store;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    store = JSON.parse(raw);
  } catch {
    console.log('ℹ️  store.json not found or empty — nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  const users    = Array.isArray(store.users)    ? store.users    : [];
  const vehicles = Array.isArray(store.vehicles) ? store.vehicles : [];
  const sosLogs  = Array.isArray(store.sosLogs)  ? store.sosLogs  : [];

  // ── Migrate users ─────────────────────────────────────────────────────────
  console.log(`📦 Migrating ${users.length} user(s)…`);
  const userIdMap = {}; // old string id → new ObjectId

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  ⏭  User ${u.email} already exists — skipping`);
      userIdMap[u.id] = existing._id;
      continue;
    }

    const created = await User.create({
      name:         u.name,
      email:        u.email,
      passwordHash: u.passwordHash,
      emergencyContacts: (u.emergencyContacts || []).map((c) => ({
        name:  c.name,
        phone: c.phone,
      })),
      createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
    });
    userIdMap[u.id] = created._id;
    console.log(`  ✅ User ${u.email} migrated`);
  }

  // ── Migrate vehicles ──────────────────────────────────────────────────────
  console.log(`\n📦 Migrating ${vehicles.length} vehicle(s)…`);
  const vehicleIdMap = {}; // old string id → new ObjectId

  for (const v of vehicles) {
    const ownerObjectId = userIdMap[v.userId];
    if (!ownerObjectId) {
      console.warn(`  ⚠️  Vehicle ${v.id} — owner ${v.userId} not found, skipping`);
      continue;
    }

    // Check by legacyId to avoid duplicates on re-run
    const existing = await Vehicle.findOne({ legacyId: v.id });
    if (existing) {
      console.log(`  ⏭  Vehicle ${v.make} ${v.model} (${v.id}) already migrated — skipping`);
      vehicleIdMap[v.id] = existing._id;
      continue;
    }

    const created = await Vehicle.create({
      userId:       ownerObjectId,
      make:         v.make,
      model:        v.model,
      year:         v.year,
      licensePlate: v.licensePlate,
      healthStatus: v.healthStatus || 'Healthy',
      battery:      v.battery      ?? 84,
      range:        v.range        ?? 260,
      tirePressure: v.tirePressure || 'OK',
      odometer:     v.odometer     ?? 0,
      fuelLogs:    (v.fuelLogs    || []).map((l) => ({ amount: l.amount, cost: l.cost, odometer: l.odometer, createdAt: l.createdAt ? new Date(l.createdAt) : undefined })),
      serviceLogs: (v.serviceLogs || []).map((l) => ({ type: l.type, description: l.description, createdAt: l.createdAt ? new Date(l.createdAt) : undefined })),
      documents:   (v.documents   || []).map((d) => ({ title: d.title, expiryDate: d.expiryDate, createdAt: d.createdAt ? new Date(d.createdAt) : undefined })),
      ecoLogs:     (v.ecoLogs     || []).map((e) => ({
        distanceKm: e.distanceKm, baseEfficiency: e.baseEfficiency, improvedEfficiency: e.improvedEfficiency,
        serviceType: e.serviceType, note: e.note,
        fuelSavedLitres: e.fuelSavedLitres, co2SavedKg: e.co2SavedKg,
        treesEquivalent: e.treesEquivalent, kmEquivalent: e.kmEquivalent,
        createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
      })),
      createdAt: v.createdAt ? new Date(v.createdAt) : undefined,
    });
    vehicleIdMap[v.id] = created._id;
    console.log(`  ✅ Vehicle ${v.make} ${v.model} migrated`);
  }

  // ── Migrate SOS logs ──────────────────────────────────────────────────────
  console.log(`\n📦 Migrating ${sosLogs.length} SOS log(s)…`);

  for (const s of sosLogs) {
    const ownerObjectId = userIdMap[s.userId];
    if (!ownerObjectId) {
      console.warn(`  ⚠️  SOS log ${s.id} — owner ${s.userId} not found, skipping`);
      continue;
    }

    const existing = await SosLog.findOne({ legacyId: s.id });
    if (existing) {
      console.log(`  ⏭  SOS log ${s.id} already migrated — skipping`);
      continue;
    }

    await SosLog.create({
      userId:           ownerObjectId,
      lat:              s.lat,
      lng:              s.lng,
      mapsLink:         s.mapsLink,
      contactsNotified: (s.contactsNotified || []).map((c) => ({
        contactId: c.contactId, name: c.name, phone: c.phone,
        status: c.status || 'skipped', error: c.error || null,
      })),
      status:        s.status || 'stopped',
      stoppedAt:     s.stoppedAt ? new Date(s.stoppedAt) : null,
      lastUpdatedAt: s.lastUpdatedAt ? new Date(s.lastUpdatedAt) : null,
      createdAt:     s.createdAt ? new Date(s.createdAt) : undefined,
    });
    console.log(`  ✅ SOS log ${s.id} migrated`);
  }

  console.log('\n─────────────────────────────────────');
  console.log('✅ Migration complete');
  console.log(`   Users    : ${users.length}`);
  console.log(`   Vehicles : ${vehicles.length}`);
  console.log(`   SOS logs : ${sosLogs.length}`);
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
