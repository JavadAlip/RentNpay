import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const getCart = (req) => {
  if (!req.cart) req.cart = [];
  return req.cart;
};

router.use((req, res, next) => {
  req.cart = req.body?.cart ? JSON.parse(req.body.cart) : (req.headers['x-cart'] ? JSON.parse(req.headers['x-cart']) : []);
  next();
});

router.get('/', (req, res) => {
  const cart = req.headers['x-cart'] ? JSON.parse(req.headers['x-cart']) : [];
  res.json({ cart: cart || [] });
});

router.post('/add', (req, res) => {
  let cart = req.body?.cart ? (typeof req.body.cart === 'string' ? JSON.parse(req.body.cart) : req.body.cart) : [];
  const { productId, quantity = 1, pricePerDay, title, image } = req.body;
  if (!productId || !pricePerDay) {
    return res.status(400).json({ message: 'productId and pricePerDay required' });
  }
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.push({ productId, quantity: Number(quantity), pricePerDay: Number(pricePerDay), title: title || '', image: image || '' });
  }
  res.json({ cart });
});

router.post('/remove', (req, res) => {
  let cart = req.body?.cart ? (typeof req.body.cart === 'string' ? JSON.parse(req.body.cart) : req.body.cart) : [];
  const { productId } = req.body;
  cart = cart.filter(i => i.productId !== productId);
  res.json({ cart });
});

router.post('/update', (req, res) => {
  let cart = req.body?.cart ? (typeof req.body.cart === 'string' ? JSON.parse(req.body.cart) : req.body.cart) : [];
  const { productId, quantity } = req.body;
  const item = cart.find(i => i.productId === productId);
  if (item) {
    if (Number(quantity) <= 0) cart = cart.filter(i => i.productId !== productId);
    else item.quantity = Number(quantity);
  }
  res.json({ cart });
});

export default router;
