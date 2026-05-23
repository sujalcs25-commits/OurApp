const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { hashPassword } = require('./utils/password');

dotenv.config();

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');

async function createDemoUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@drivecare.com' });
    if (existingUser) {
      console.log('[Demo] Demo user already exists!');
      console.log('Email: demo@drivecare.com');
      console.log('Password: Demo1234');
      process.exit(0);
    }

    // Create demo user
    const hashedPassword = hashPassword('Demo1234');
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@drivecare.com',
      password: hashedPassword,
    });

    await demoUser.save();
    console.log('[Demo] ✓ Demo user created successfully!');

    // Create demo vehicle
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
    console.log('[Demo] ✓ Demo vehicle created successfully!');

    console.log('\n=================================');
    console.log('Demo Account Created!');
    console.log('=================================');
    console.log('Email: demo@drivecare.com');
    console.log('Password: Demo1234');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Error]', error.message);
    process.exit(1);
  }
}

createDemoUser();
