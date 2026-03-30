import dotenv from 'dotenv';
dotenv.config(); // ✅ MUST BE FIRST

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

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
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
    console.error(`
→ SRV DNS lookup failed (common when offline, strict DNS, or bad Atlas hostname).

  Fix options:
  1) Add to backend/.env (keep Atlas in MONGODB_URI):
     MONGODB_URI_FALLBACK=mongodb://127.0.0.1:27017/rentpay
     The server will use it automatically when SRV lookup fails (local Mongo must be running).
  2) Or set MONGODB_URI alone to: mongodb://127.0.0.1:27017/rentpay
  3) Atlas: copy a fresh URI; confirm cluster exists and is not paused.
  4) Network: try other Wi‑Fi, VPN off, or DNS 8.8.8.8 / 1.1.1.1.
  5) Use Atlas "standard connection string" (non-SRV) if SRV is blocked.
`);
  } else if (!process.env.MONGODB_URI?.trim()) {
    console.error(
      '→ MONGODB_URI is missing. Copy backend/.env.example to backend/.env and set MONGODB_URI.',
    );
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
      console.warn(
        '⚠ MONGODB_URI SRV lookup failed — trying MONGODB_URI_FALLBACK…',
      );
      await mongoose.connect(fallback);
      return { uri: fallback, usedFallback: true };
    }
    throw err;
  }
}

connectMongo()
  .then(({ usedFallback }) => {
    console.log(
      usedFallback
        ? '✅ MongoDB Connected (using MONGODB_URI_FALLBACK)'
        : '✅ MongoDB Connected',
    );
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    logMongoConnectionHelp(err);
    process.exit(1);
  });
