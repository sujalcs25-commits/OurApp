const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users`);

  for (const u of users) {
    const v = await Vehicle.find({ userId: u._id }).lean();
    console.log(`User ${u.email} has ${v.length} vehicles.`);
    if (v.length === 0) {
      console.log(`  --> User ${u.email} has no vehicles! Maybe failed during signup?`);
    }
  }

  process.exit(0);
}

check().catch(console.error);
