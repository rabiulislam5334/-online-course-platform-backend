require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const errorHandler = require('./middlewares/errorHandler');

// Routes
const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const roleRoutes        = require('./routes/roles');
const courseRoutes      = require('./routes/courses');
const lessonRoutes      = require('./routes/lessons');
const quizRoutes        = require('./routes/quizzes');
const enrollmentRoutes  = require('./routes/enrollments');
const certRoutes        = require('./routes/certificates');

const app = express();

// ── Security ────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate Limiting ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(limiter);

// ── Body / Logging ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Static files (uploads) ──────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/roles',        roleRoutes);
app.use('/api/courses',      courseRoutes);
app.use('/api/lessons',      lessonRoutes);
app.use('/api/quizzes',      quizRoutes);
app.use('/api/enrollments',  enrollmentRoutes);
app.use('/api/certificates', certRoutes);

// ── 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ────────────────────────────────
app.use(errorHandler);

module.exports = app;
