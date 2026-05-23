const fs = require('fs/promises');
const path = require('path');

const dataDir = __dirname;
const storePath = path.join(dataDir, 'store.json');
const defaultStore = { users: [], vehicles: [], sosLogs: [] };

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(defaultStore, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
      sosLogs: Array.isArray(parsed.sosLogs) ? parsed.sosLogs : [],
    };
  } catch {
    await fs.writeFile(storePath, JSON.stringify(defaultStore, null, 2));
    return { ...defaultStore };
  }
}

async function writeStore(store) {
  await ensureStore();
  // Atomic write: write to .tmp then rename to prevent corruption on crash
  const tmpPath = storePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2));
  await fs.rename(tmpPath, storePath);
}

module.exports = { readStore, writeStore };
