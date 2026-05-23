const mongoose = require('mongoose');
const dns = require('dns');
if (dns.setServers) dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const { hashPassword } = require('./utils/password');

async function testFuelEfficiency() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'drivecare' });
    console.log('✅ Connected to MongoDB');

    // 1. Create a user and vehicle
    const email = 'fuel_test_' + Date.now() + '@example.com';
    const user = await User.create({
      name: 'Fuel Tester',
      email: email,
      passwordHash: hashPassword('password123')
    });

    const vehicle = await Vehicle.create({
      userId: user._id,
      make: 'Efficiency',
      model: 'Test',
      odometer: 1000
    });

    // 2. Add first fuel log
    vehicle.fuelLogs.push({ amount: 30, cost: 3000, odometer: 1000 });
    await vehicle.save();

    // 3. Add second fuel log
    vehicle.odometer = 1500;
    vehicle.fuelLogs.push({ amount: 40, cost: 4000, odometer: 1500 });
    await vehicle.save();

    // 4. Mimic Frontend Logic
    const sortedLogs = [...vehicle.fuelLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let totalVolume = 0;
    sortedLogs.forEach(log => totalVolume += log.amount);

    console.log('Logs count:', sortedLogs.length);
    console.log('Total Volume:', totalVolume);

    let avgEff = 0;
    if (sortedLogs.length >= 2 && sortedLogs[0].odometer && sortedLogs[sortedLogs.length-1].odometer) {
        const distance = sortedLogs[0].odometer - sortedLogs[sortedLogs.length-1].odometer;
        console.log('Distance covered:', distance);
        if (distance > 0 && totalVolume > 0) avgEff = distance / totalVolume;
    }

    console.log('Calculated Avg Efficiency:', avgEff);

    // Cleanup
    await Vehicle.deleteOne({ _id: vehicle._id });
    await User.deleteOne({ _id: user._id });

    if (avgEff > 0) {
        console.log('✅ Efficiency calculation works in principle.');
    } else {
        console.warn('❌ Efficiency calculation returned 0.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testFuelEfficiency();
