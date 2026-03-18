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

// DB + Server start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
