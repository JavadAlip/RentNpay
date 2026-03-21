import { createSlice } from '@reduxjs/toolkit';

const loadCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem('rentpay_cart');
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rentpay_cart', JSON.stringify(cart));
  }
};

const initialState = { items: loadCart() };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, { payload }) => {
      const { productId, quantity = 1, pricePerDay, title, image } = payload;
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) existing.quantity += quantity;
      else state.items.push({ productId, quantity, pricePerDay, title, image });
      saveCart(state.items);
    },
    removeFromCart: (state, { payload }) => {
      state.items = state.items.filter((i) => i.productId !== payload);
      saveCart(state.items);
    },
    updateQuantity: (state, { payload }) => {
      const item = state.items.find((i) => i.productId === payload.productId);
      if (!item) return;
      if (payload.quantity <= 0) {
        state.items = state.items.filter((i) => i.productId !== payload.productId);
      } else item.quantity = payload.quantity;
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
