import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import adminRoutes from './routes/admin.js';
import vendorRoutes from './routes/vendor.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import ensureUserCustomerNumbers from './utils/ensureUserCustomerNumbers.js';

const app = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://rentnpay-admin.vercel.app',
  'https://rentnpay.vercel.app',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),
];

const corsOptions = {
  origin(origin, cb) {
    // Allow server-to-server/no-origin tools.
    if (!origin) return cb(null, true);

    const raw = String(origin).trim();
    const lower = raw.toLowerCase();
    const isVercelApp = lower.endsWith('.vercel.app');

    // Explicit allowlist + all vercel preview/prod domains.
    if (allowedOrigins.includes(raw) || isVercelApp) return cb(null, true);

    // Return "not allowed" without throwing hard error middleware.
    // return cb(null, false);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200,
};

// Fail-safe CORS headers for hosting/proxy preflight quirks on Render.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const lower = String(origin).toLowerCase();
    const isAllowed =
      allowedOrigins.includes(origin) || lower.endsWith('.vercel.app');
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
  }
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  );
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  return next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Server error' });
});

function logMongoConnectionHelp(err) {
  console.error('MongoDB connection error:', err.message || err);
  const code = err?.code;
  const msg = String(err?.message || '');
  if (code === 'ENOTFOUND' && msg.toLowerCase().includes('querysrv')) {
  } else if (!process.env.MONGODB_URI?.trim()) {
  }
}

// DB + Server start
const mongoUri = process.env.MONGODB_URI?.trim();
if (!mongoUri) {
  logMongoConnectionHelp({ message: 'MONGODB_URI is not set', code: '' });
  process.exit(1);
}

function isSrvDnsFailure(err) {
  return (
    err?.code === 'ENOTFOUND' &&
    String(err?.message || '')
      .toLowerCase()
      .includes('querysrv')
  );
}

async function connectMongo() {
  const fallback = process.env.MONGODB_URI_FALLBACK?.trim();
  try {
    await mongoose.connect(mongoUri);
    return { uri: mongoUri, usedFallback: false };
  } catch (err) {
    if (fallback && fallback !== mongoUri && isSrvDnsFailure(err)) {
      await mongoose.connect(fallback);
      return { uri: fallback, usedFallback: true };
    }
    throw err;
  }
}

connectMongo()
  .then(async ({ usedFallback }) => {
    console.log(
      usedFallback
        ? '✅ MongoDB Connected (using MONGODB_URI_FALLBACK)'
        : ' MongoDB Connected',
    );
    try {
      await ensureUserCustomerNumbers();
    } catch (e) {
      console.error('ensureUserCustomerNumbers:', e?.message || e);
    }
    app.listen(process.env.PORT || 5000, () => {
      console.log(` Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    logMongoConnectionHelp(err);
    process.exit(1);
  });
