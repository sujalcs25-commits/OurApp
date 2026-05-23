const mongoose = require('mongoose');
const { hashPassword } = require('./utils/password');

// Use environment variable or hardcoded for Render
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://hello123srinavas_db_user:qNCfxNKFyNm0eSy9@ac-g8dfhnb-shard-00-00.4sgbyn9.mongodb.net:27017,ac-g8dfhnb-shard-00-01.4sgbyn9.mongodb.net:27017,ac-g8dfhnb-shard-00-02.4sgbyn9.mongodb.net:27017/drivecare?ssl=true&authSource=admin&replicaSet=atlas-qwsrnk-shard-0&retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const VehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: String,
  licensePlate: String,
  isPrimary: { type: Boolean, default: false },
  fuelLogs: [{
    date: Date,
    liters: Number,
    cost: Number,
    odometer: Number,
    fuelType: String,
    station: String,
  }],
  serviceLogs: [{
    date: Date,
    type: String,
    cost: Number,
    odometer: Number,
    notes: String,
  }],
  documents: [{
    type: String,
    name: String,
    expiryDate: Date,
    notes: String,
  }],
});

const User = mongoose.model('User', UserSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);

async function createDemoUser() {
  try {
    console.log('[Demo] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Demo] ✓ Connected to MongoDB');

    // Check if demo user exists
    const existingUser = await User.findOne({ email: 'demo@drivecare.com' });
    if (existingUser) {
      console.log('[Demo] Demo user already exists!');
      console.log('Email: demo@drivecare.com');
      console.log('Password: Demo1234');
      
      // Check if demo vehicle exists
      const existingVehicle = await Vehicle.findOne({ userId: existingUser._id });
      if (!existingVehicle) {
        console.log('[Demo] Creating demo vehicle...');
        const demoVehicle = new Vehicle({
          userId: existingUser._id,
          make: 'Tesla',
          model: 'Model 3',
          year: '2023',
          licensePlate: 'DEMO123',
          isPrimary: true,
          fuelLogs: [
            {
              date: new Date('2024-01-15'),
              liters: 50,
              cost: 4000,
              odometer: 15000,
              fuelType: 'Electric',
              station: 'Tesla Supercharger',
            },
          ],
          serviceLogs: [
            {
              date: new Date('2024-01-20'),
              type: 'Tire Rotation',
              cost: 2000,
              odometer: 15100,
              notes: 'Regular tire rotation service',
            },
          ],
        });
        await demoVehicle.save();
        console.log('[Demo] ✓ Demo vehicle created!');
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create demo user
    console.log('[Demo] Creating demo user...');
    const hashedPassword = hashPassword('Demo1234');
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@drivecare.com',
      password: hashedPassword,
    });

    await demoUser.save();
    console.log('[Demo] ✓ Demo user created!');

    // Create demo vehicle
    console.log('[Demo] Creating demo vehicle...');
    const demoVehicle = new Vehicle({
      userId: demoUser._id,
      make: 'Tesla',
      model: 'Model 3',
      year: '2023',
      licensePlate: 'DEMO123',
      isPrimary: true,
      fuelLogs: [
        {
          date: new Date('2024-01-15'),
          liters: 50,
          cost: 4000,
          odometer: 15000,
          fuelType: 'Electric',
          station: 'Tesla Supercharger',
        },
        {
          date: new Date('2024-02-10'),
          liters: 45,
          cost: 3600,
          odometer: 15500,
          fuelType: 'Electric',
          station: 'Tesla Supercharger',
        },
      ],
      serviceLogs: [
        {
          date: new Date('2024-01-20'),
          type: 'Tire Rotation',
          cost: 2000,
          odometer: 15100,
          notes: 'Regular tire rotation service',
        },
      ],
      documents: [
        {
          type: 'Insurance',
          name: 'Vehicle Insurance Policy',
          expiryDate: new Date('2025-12-31'),
          notes: 'Comprehensive coverage',
        },
      ],
    });

    await demoVehicle.save();
    console.log('[Demo] ✓ Demo vehicle created!');

    console.log('\n=================================');
    console.log('Demo Account Created Successfully!');
    console.log('=================================');
    console.log('Email: demo@drivecare.com');
    console.log('Password: Demo1234');
    console.log('=================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Error]', error.message);
    console.error(error);
    process.exit(1);
  }
}

createDemoUser();
