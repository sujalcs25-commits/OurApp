# 🚗 DriveCare — Smart Vehicle Management App

> A full-stack mobile application for managing your vehicles, tracking fuel expenses, scheduling services, storing documents, and emergency SOS alerts.

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/)

---

## 📌 Overview

DriveCare is a comprehensive vehicle management solution built with React Native (Expo) and Node.js. It helps vehicle owners track expenses, manage maintenance, store important documents, and access emergency services—all from one beautiful, intuitive interface.

**Live Demo:** [https://drive-care.onrender.com](https://drive-care.onrender.com)

---

## ✨ Key Features

### 🏠 **Smart Dashboard**
- View primary vehicle at a glance
- Quick access to all features
- Upcoming service reminders
- Eco impact summary

### ⛽ **Fuel Expense Tracker**
- Log fuel purchases with amount and cost
- Track total spending over time
- View detailed fuel history
- Edit and delete fuel records

### 🔧 **Service Management**
- Schedule maintenance reminders
- Track service history
- Mark services as completed
- Restore completed services

### 📄 **Document Vault**
- Store vehicle documents securely
- Set expiry date reminders
- Visual indicators for expired documents
- Edit and delete documents

### 🌱 **Eco Impact Monitor**
- Track CO₂ savings
- Calculate tree equivalents
- Earn eco badges
- View environmental contributions

### 🚨 **Emergency SOS**
- One-tap emergency alert
- Share live location
- Contact emergency services
- Manage emergency contacts

### 🚗 **Multi-Vehicle Support**
- Manage multiple vehicles
- Set primary vehicle
- Switch between vehicles easily
- Individual tracking per vehicle

### 👤 **Profile Management**
- Update personal information
- Change password securely
- Manage account settings
- Configure API endpoints

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React Native with Expo SDK 54
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Navigation:** React Navigation v7
- **Animations:** React Native Reanimated 2
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Storage:** AsyncStorage

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Node.js Crypto (scrypt)
- **Environment:** dotenv

---

## 📁 Project Structure

```
OurApp-main/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Vehicle.js            # Vehicle schema
│   │   └── SosLog.js             # SOS log schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── profile.js            # Profile routes
│   │   ├── vehicles.js           # Vehicle CRUD + logs
│   │   └── sos.js                # Emergency routes
│   ├── utils/
│   │   ├── jwt.js                # JWT helpers
│   │   └── password.js           # Password hashing
│   ├── .env.example              # Environment template
│   ├── package.json
│   └── server.js                 # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/               # Reusable UI components
│   │   │       ├── Button.js
│   │   │       └── Input.js
│   │   ├── context/
│   │   │   └── AuthContext.js    # Authentication state
│   │   ├── navigation/
│   │   │   └── AppNavigator.js   # Navigation setup
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── FuelTrackerScreen.js
│   │   │   ├── ServiceRemindersScreen.js
│   │   │   ├── DocumentsScreen.js
│   │   │   ├── VehicleHealthScreen.js
│   │   │   ├── EcoImpactScreen.js
│   │   │   ├── MyVehiclesScreen.js
│   │   │   ├── SOSScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── SettingsScreen.js
│   │   │   └── ...auth screens
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   └── utils/
│   │       ├── alert.js          # Cross-platform alerts
│   │       └── currency.js       # INR formatting
│   ├── assets/                   # Images and icons
│   ├── .env.example
│   ├── app.json                  # Expo configuration
│   ├── package.json
│   └── App.js                    # Entry point
│
└── README.md
```

---

## � Quick Start

### Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI** (optional, for mobile development)

### 1. Clone Repository

```bash
git clone https://github.com/sujalcs25-commits/OurApp.git
cd OurApp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/drivecare

# JWT secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# CORS origins
CORS_ORIGIN=http://localhost:8081,http://localhost:19006

# Optional: Twilio for SOS SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Start backend:

```bash
npm start
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
# Web
npm run web

# Android
npm run android

# iOS (macOS only)
npm run ios
```

---

## 📱 Building APK

### Using EAS Build (Recommended)

```bash
cd frontend

# Build APK for Android
npx eas-cli build --platform android --profile preview

# Check build status
npx eas-cli build:list
```

The APK will be available for download from your Expo dashboard once the build completes.

### Build Profiles

- **preview:** Development APK with debugging enabled
- **production:** Production-ready APK for release

---

## 🔑 Demo Account

Try the app without registration:

- **Email:** `demo@drivecare.com`
- **Password:** `demo123`

---

## 📡 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Vehicles

```http
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
POST   /api/vehicles/:id/primary
```

### Fuel Logs

```http
POST   /api/vehicles/:id/fuel
PUT    /api/vehicles/:id/fuel/:fuelId
DELETE /api/vehicles/:id/fuel/:fuelId
```

### Service Logs

```http
POST   /api/vehicles/:id/service
PUT    /api/vehicles/:id/service/:serviceId
DELETE /api/vehicles/:id/service/:serviceId
```

### Documents

```http
POST   /api/vehicles/:id/documents
PUT    /api/vehicles/:id/documents/:docId
DELETE /api/vehicles/:id/documents/:docId
```

### Eco Impact

```http
POST /api/vehicles/:id/eco
GET  /api/vehicles/:id/eco
```

### SOS

```http
GET    /api/sos/contacts
POST   /api/sos/contacts
PUT    /api/sos/contacts/:id
DELETE /api/sos/contacts/:id
POST   /api/sos/trigger
POST   /api/sos/:id/stop
GET    /api/sos/history
```

---

## 🎨 Design System

DriveCare uses a custom design system based on Material Design 3 principles:

- **Primary Color:** `#0040a1` (Deep Blue)
- **Surface Colors:** Light mode optimized
- **Typography:** System fonts with custom weights
- **Animations:** Smooth transitions with Reanimated 2
- **Icons:** Material Icons

---

## � Security Features

- ✅ Password hashing with `crypto.scryptSync`
- ✅ JWT-based authentication
- ✅ Protected API routes
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Secure token storage
- ✅ Environment variable protection

---

## 🧪 Testing

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

---

## 📦 Deployment

### Backend (Render.com)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Frontend (Expo)

```bash
cd frontend
npx eas-cli build --platform android --profile production
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sujal Tompe**

- GitHub: [@sujalcs25-commits](https://github.com/sujalcs25-commits)
- Repository: [OurApp](https://github.com/sujalcs25-commits/OurApp)

---

## 🙏 Acknowledgments

- React Native and Expo teams
- MongoDB Atlas
- Material Design Icons
- NativeWind community

---

## 📞 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/sujalcs25-commits/OurApp/issues)
- Check existing documentation
- Review closed issues for solutions

---

**Made with ❤️ for vehicle owners everywhere**
