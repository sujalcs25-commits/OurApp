console.log('DEBUG: server.js starting. MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();
console.log('DEBUG: MONGODB_URI is', process.env.MONGODB_URI ? 'SET' : 'MISSING');

const connectDB = require('./config/db');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/sos',      require('./routes/sos'));

// Root health-check
app.get('/', (_req, res) => res.json({ message: 'Welcome to DriveCare API', db: 'MongoDB' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ msg: 'Route not found' }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ msg: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`[Server] Running on ${HOST}:${PORT}`);
      console.log(`[Server] Access from network: http://<your-ip>:${PORT}`);
    });
  });
}

module.exports = app;
