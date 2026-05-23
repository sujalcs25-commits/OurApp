const mongoose = require('mongoose');
const dns = require('dns');
if (dns.setServers) dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const Vehicle = require('./models/Vehicle');

async function checkJson() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'drivecare' });
  const vehicles = await Vehicle.find({}).limit(1);
  if (vehicles.length > 0) {
    console.log('Vehicle JSON:', JSON.stringify(vehicles[0].toJSON(), null, 2));
  } else {
    console.log('No vehicles found to check JSON.');
  }
  process.exit(0);
}

checkJson();
