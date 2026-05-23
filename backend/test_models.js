const mongoose = require('mongoose');
const dns = require('dns');
if (dns.setServers) dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const { hashPassword } = require('./utils/password');

async function testCrud() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'drivecare' });
    console.log('✅ Connected to MongoDB');

    const email = 'test_crud_' + Date.now() + '@example.com';
    
    // 1. CREATE User
    console.log('[1] Creating user...');
    const user = await User.create({
      name: 'Tester',
      email: email,
      passwordHash: hashPassword('password123')
    });
    console.log('✅ User created:', user.email);

    // 2. CREATE Vehicle
    console.log('[2] Adding vehicle...');
    const vehicle = await Vehicle.create({
      userId: user._id,
      make: 'TestMake',
      model: 'TestModel',
      year: 2024,
      licensePlate: 'CRUD-TEST'
    });
    console.log('✅ Vehicle added:', vehicle.make, vehicle.model);

    // 3. READ
    console.log('[3] Reading vehicle...');
    const foundVehicle = await Vehicle.findOne({ userId: user._id });
    console.log('✅ Read success. Found:', foundVehicle.licensePlate);

    // 4. UPDATE
    console.log('[4] Updating vehicle...');
    foundVehicle.color = 'Green';
    await foundVehicle.save();
    console.log('✅ Update success. Color is now:', foundVehicle.color);

    // 5. DELETE
    console.log('[5] Deleting user and vehicles...');
    await Vehicle.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log('✅ Delete success. Cleanup done.');

    console.log('\n--- Model CRUD Tests Passed! ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ CRUD Test Failed:', err);
    process.exit(1);
  }
}

testCrud();
