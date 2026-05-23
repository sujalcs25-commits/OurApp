/**
 * migrate-currency-to-inr.js
 * ──────────────────────────
 * One-time migration: converts all fuelLog.cost values in store.json
 * from USD to INR using a fixed conversion rate.
 *
 * Usage:
 *   node backend/scripts/migrate-currency-to-inr.js
 *
 * The script:
 *   1. Reads store.json
 *   2. Multiplies every fuelLog.cost by USD_TO_INR
 *   3. Writes the result back (atomic write via .tmp file)
 *   4. Prints a summary of what was changed
 *
 * Safe to run multiple times — it checks for a migration flag
 * (vehicle.currencyMigrated) and skips already-migrated vehicles.
 */

const fs = require('fs/promises');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/store.json');
const USD_TO_INR = 83.5; // Approximate rate — update if needed

async function migrate() {
  console.log('📦 Reading store.json…');
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  const store = JSON.parse(raw);

  let totalVehicles = 0;
  let totalLogsConverted = 0;
  let skippedVehicles = 0;

  for (const vehicle of store.vehicles) {
    if (vehicle.currencyMigrated) {
      console.log(`  ⏭  Skipping ${vehicle.make} ${vehicle.model} (${vehicle.id}) — already migrated`);
      skippedVehicles++;
      continue;
    }

    const logs = Array.isArray(vehicle.fuelLogs) ? vehicle.fuelLogs : [];
    let converted = 0;

    for (const log of logs) {
      if (typeof log.cost === 'number' && log.cost > 0) {
        const originalCost = log.cost;
        log.cost = parseFloat((log.cost * USD_TO_INR).toFixed(2));
        console.log(`    💰 Fuel log ${log.id}: $${originalCost} → ₹${log.cost}`);
        converted++;
      }
    }

    vehicle.currencyMigrated = true;
    vehicle.currencyMigratedAt = new Date().toISOString();
    totalLogsConverted += converted;
    totalVehicles++;

    console.log(`  ✅ ${vehicle.make} ${vehicle.model} — ${converted} fuel log(s) converted`);
  }

  // Atomic write
  const tmpPath = STORE_PATH + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2));
  await fs.rename(tmpPath, STORE_PATH);

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Migration complete`);
  console.log(`   Vehicles processed : ${totalVehicles}`);
  console.log(`   Vehicles skipped   : ${skippedVehicles}`);
  console.log(`   Fuel logs converted: ${totalLogsConverted}`);
  console.log(`   Rate used          : 1 USD = ${USD_TO_INR} INR`);
  console.log('─────────────────────────────────────');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
