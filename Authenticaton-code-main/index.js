import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRouter from './routes/userRouter.js';

dotenv.config();

const app = express();

// Enable CORS for all environments (local & deployed domains with credentials)
app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for easy cross-deployment compatibility
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Jivexa Authentication Backend API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Jivexa Authentication Backend API', timestamp: new Date().toISOString() });
});

// Mount user authentication routes at both /user and /api/auth
app.use("/user", userRouter);
app.use("/api/auth", userRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Jivexa Auth Server] running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[Jivexa Auth Server Startup Error]:", error);
  }
};

startServer();