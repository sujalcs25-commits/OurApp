const mongoose = require('mongoose');
require('dotenv').config();

async function fixDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');

  const users = await User.find({}).lean();
  
  for (const u of users) {
    const v = await Vehicle.find({ userId: u._id }).lean();
    if (v.length === 0) {
      console.log(`Deleting corrupted user ${u.email} without vehicles...`);
      await User.deleteOne({ _id: u._id });
    }
  }

  console.log('Done cleaning up database.');
  process.exit(0);
}

fixDB().catch(console.error);
