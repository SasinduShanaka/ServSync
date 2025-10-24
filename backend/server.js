import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
dotenv.config();

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('NOTIFYLK_USER_ID:', process.env.NOTIFYLK_USER_ID);
console.log('NOTIFYLK_API_KEY:', process.env.NOTIFYLK_API_KEY ? 'SET' : 'NOT SET');
console.log('NOTIFYLK_SENDER_ID:', process.env.NOTIFYLK_SENDER_ID);
import { connectDB } from './config/db.js';
import cors from 'cors';
import session from 'express-session';
import morgan from 'morgan';
import winston from 'winston';
import expressWinston from 'express-winston';

// Import Routes
import sessionRoutes from './routes/session.routes.js';
import branchRoutes from './routes/branch.routes.js';
import insuranceTypeRoutes from './routes/insuranceType.routes.js';
import userRouter from './routes/userRoutes.js';
import roleRouter from './routes/roleRouters.js';
import complaintsRoutes from './routes/complaints.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import feedbackInviteRoutes from './routes/feedbackInvite.routes.js';
import resetPasswordRoutes from './routes/resetPassword.routes.js';
import tokenRoutes from './routes/token.routes.js';
import claimRoutes from './routes/claim.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import { startSmsWorker } from './workers/sms.worker.js';
import counterRoutes from './routes/counter.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import testSmsRoutes from './routes/testSms.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import banksRoutes from './routes/banks.routes.js';
import path from 'path';
import fs from 'fs';
import iotRoutes from './routes/iot.routes.js';



// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
// Create HTTP server to attach Socket.IO
const server = http.createServer(app);
// Attach Socket.IO with proper CORS
import { attachSocketServer } from './realtime/socket.js';
attachSocketServer(server);

// ============================
// Auth middlewares using session
// ============================
const requireUser = (req, res, next) => {
  if (req?.session?.nic) return next();
  return res.status(401).json({ message: 'Not logged in (user)' });
};

const requireStaff = (req, res, next) => {
  if (req?.session?.staffNic) return next();
  return res.status(401).json({ message: 'Not logged in (staff)' });
};
// CORS middleware
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser (curl)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Parse JSON
app.use(express.json());
// Serve uploaded files statically (configurable directory)
const STATIC_UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(STATIC_UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(STATIC_UPLOAD_DIR));

// Password reset routes
app.use('/reset-password', resetPasswordRoutes);

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || "devsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60
  }
}));

// ============================
// Logging Middleware
// ============================

// Morgan for concise request logging
app.use(morgan('dev'));

// Express-Winston for structured logging
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  meta: true,               // log metadata about request
  msg: "HTTP {{req.method}} {{req.url}}", // custom message
  expressFormat: true,      // default format like :method :url :status
  colorize: true
}));

// ============================
// Routes
// ============================
// Session listing should be public for customers; writes are staff-only.
app.use('/api/sessions', (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireStaff(req, res, next);
}, sessionRoutes);

app.use('/api/branches', branchRoutes);
app.use('/api/insurance-types', insuranceTypeRoutes);
app.use('/users', userRouter);
app.use('/roles', roleRouter);

// Complaints endpoints are used by frontend at /support
app.use('/api/complaints', complaintsRoutes);
// Feedback endpoints are used by frontend at /api/feedback
app.use('/api/feedback', feedbackRoutes);
// Invite and submit helpers also mounted under /api/feedback
app.use('/api/feedback', feedbackInviteRoutes); // exposes /api/feedback/session/:id/invite and /api/feedback/submit
// File uploads (user must be logged in to upload)
app.use('/api/uploads', requireUser, uploadRoutes);

// Token and Claim routes for Live Queue / CCO
app.use('/api/tokens', requireStaff, tokenRoutes);
app.use('/api/claims', requireStaff, claimRoutes);
// Banks and branches (staff only for now)
app.use('/api/banks', requireStaff, banksRoutes);
// Analytics (staff only)
app.use('/api/analytics', requireStaff, analyticsRoutes);
// Counter maintenance (list/reset)
app.use('/api/counters', requireStaff, counterRoutes);
// IoT display endpoints (public, read-only)
app.use('/api/iot', iotRoutes);
// Receptionist/CCO check-in (staff only)
app.use('/api/checkin', requireStaff, checkinRoutes);
// Customer appointment booking (user only), but allow staff routes under /staff/*
app.use('/api/appointments', (req, res, next) => {
  if (req.path.startsWith('/staff/')) return requireStaff(req, res, next);
  return requireUser(req, res, next);
}, appointmentRoutes);
// Test SMS (public for testing)
app.use('/api/test-sms', testSmsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("ServSync API is running ✅");
});

// ============================
// Start Server
// ============================
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    // Start background workers
    if (process.env.SMS_WORKER_ENABLED !== 'false') {
      startSmsWorker({ intervalMs: Number(process.env.SMS_WORKER_INTERVAL_MS) || 5000 });
    }
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Local access: http://localhost:${PORT}`);
      console.log(`Network access: http://[YOUR_LOCAL_IP]:${PORT}`);
      console.log(`To find your IP: run 'ipconfig' in cmd and look for IPv4 Address`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};



startServer();
