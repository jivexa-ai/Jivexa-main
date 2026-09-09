import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRouter from './routes/userRouter.js';

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

// Enable CORS with explicit ALLOWED_ORIGINS allowlist
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
    }
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
    if (!process.env.JWT_SECRET) {
      console.error("[Jivexa Auth Server Startup Error]: JWT_SECRET environment variable is not set.");
      process.exit(1);
    }
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Jivexa Auth Server] running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[Jivexa Auth Server Startup Error]:", error);
    process.exit(1);
  }
};

startServer();