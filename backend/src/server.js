const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Configure CORS for Cookie & Authorization header transmission
app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(cookieParser());

// Auth API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/health-id', require('./routes/healthIdRoutes'));

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'JIVEXA Health OS Backend Service',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `[JIVEXA Backend] Production-Grade Auth Server running in ${
          process.env.NODE_ENV || 'development'
        } mode on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error('[JIVEXA Backend] Failed to start:', error);
    process.exit(1);
  }
};

startServer();