# 🚗 DriveCare — Smart Vehicle Management App

> A full-stack mobile application for managing your vehicles, tracking fuel, scheduling services, monitoring eco impact, and triggering emergency SOS alerts.

---

## 📌 Project Description

DriveCare is a React Native (Expo) + Node.js + MongoDB application that helps vehicle owners in India manage everything about their cars from one clean dashboard.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | Secure register / login with JWT tokens |
| 🚗 Garage | Add, edit, delete vehicles with fuel type, service dates, and odometer |
| ⛽ Fuel Tracker | Log fill-ups, track total spend and average efficiency (km/L) |
| 🔧 Service Reminders | Log maintenance history, set next service due date / km |
| 🏥 Vehicle Health | Battery, range, tire pressure diagnostics |
| 📄 Documents | Store insurance, registration, and other vehicle documents |
| 🌱 Eco Impact | Calculate CO₂ saved after servicing, earn eco badges |
| 🚨 SOS Emergency | One-tap SOS with live GPS sharing to emergency contacts via SMS (Twilio) |
| 👤 Profile | Edit name, phone, change password |

---

## 🛠️ Tech Stack

**Frontend**
- React Native (Expo SDK 54)
- NativeWind v4 (Tailwind CSS for React Native)
- React Navigation (Stack + Bottom Tabs)
- Expo Location
- Axios
- React Native Reanimated

**Backend**
- Node.js + Express v5
- MongoDB Atlas + Mongoose
- JSON Web Tokens (JWT)
- Twilio REST API (optional — for SOS SMS)

---

## 📁 Project Structure

```
DriveCare/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   └── SosLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── vehicles.js
│   │   └── sos.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── password.js
│   ├── scripts/
│   │   └── migrate-json-to-mongodb.js
│   ├── server.js
│   ├── .env.example          # ← copy this to .env and fill in values
│   └── package.json
│
├── frontend/                 # React Native (Expo)
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   │   └── api.js        # All API calls
│   │   └── utils/
│   │       └── currency.js   # INR formatting
│   ├── App.js
│   └── package.json
│
└── README.md
```

---

## 📦 Installation & Setup

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- A smartphone with the [Expo Go](https://expo.dev/client) app (for testing)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Srinivas092/DriveCare.git
cd DriveCare
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure environment variables:**

```bash
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

# Your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/

# A long random string for signing JWT tokens
JWT_SECRET=replace_with_a_long_random_secret_string

# Allowed frontend origins (comma-separated)
CORS_ORIGIN=http://localhost:8081,http://localhost:19006

# Twilio (optional — SOS SMS will be skipped if not set)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

**Start the backend:**

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Configure the API URL (optional):**

If your backend is running on a different host or port, create a `.env` file in the `frontend/` folder:

```env
EXPO_PUBLIC_API_URL=http://your-backend-ip:5000/api
```

> **Android emulator:** The app automatically uses `http://10.0.2.2:5000/api`  
> **iOS simulator / physical device:** Uses `http://127.0.0.1:5000/api`  
> **Physical Android device:** Set `EXPO_PUBLIC_API_URL` to your machine's local IP, e.g. `http://192.168.1.10:5000/api`

**Start the frontend:**

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID (for SOS SMS) |
| `TWILIO_AUTH_TOKEN` | No | Twilio Auth Token (for SOS SMS) |
| `TWILIO_FROM_NUMBER` | No | Twilio phone number (for SOS SMS) |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login and get JWT |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get current user profile |
| PUT | `/api/profile` | Update name / phone |
| PUT | `/api/profile/password` | Change password |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all user vehicles |
| GET | `/api/vehicles/:id` | Get single vehicle |
| POST | `/api/vehicles` | Add vehicle |
| PUT | `/api/vehicles/:id` | Edit vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |
| POST | `/api/vehicles/:id/primary` | Set as primary vehicle |
| POST | `/api/vehicles/:id/fuel` | Add fuel log |
| POST | `/api/vehicles/:id/service` | Add service log |
| POST | `/api/vehicles/:id/documents` | Add document |
| POST | `/api/vehicles/:id/eco` | Log eco impact |
| GET | `/api/vehicles/:id/eco` | Get eco summary |

### SOS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sos/contacts` | List emergency contacts |
| POST | `/api/sos/contacts` | Add emergency contact |
| PUT | `/api/sos/contacts/:id` | Edit contact |
| DELETE | `/api/sos/contacts/:id` | Delete contact |
| POST | `/api/sos/trigger` | Trigger SOS alert |
| POST | `/api/sos/:id/location` | Update live location |
| POST | `/api/sos/:id/stop` | Stop SOS session |
| GET | `/api/sos/history` | SOS history |

---

## 🧪 Demo Account

The app ships with a demo account you can use to explore without registering:

```
Email:    demo@drivecare.com
Password: Demo1234
```

---

## 🔐 Security Notes

- All passwords are hashed using `crypto.scryptSync` (Node built-in, no extra dependencies)
- JWT tokens expire after 7 days
- The `passwordHash` field is never returned in API responses
- All vehicle and SOS routes require a valid JWT token
- The `.env` file is gitignored — **never commit real credentials**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning or as a base for your own app.

---

*Built with ❤️ for vehicle owners in India*
