import { createSlice } from '@reduxjs/toolkit';

function getCartStorageKey() {
  if (typeof window === 'undefined') return 'rentpay_cart_guest';
  try {
    // Your current auth persistence uses `userToken` + `userData`.
    // Cart should follow the logged-in user stored in `userData`.
    const userStr = localStorage.getItem('userData');
    if (!userStr) return 'rentpay_cart_guest';
    const user = JSON.parse(userStr);
    const userId = user?.id || user?._id;
    return userId ? `rentpay_cart_${userId}` : 'rentpay_cart_guest';
  } catch {
    return 'rentpay_cart_guest';
  }
}

const loadCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const key = getCartStorageKey();
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  if (typeof window !== 'undefined') {
    const key = getCartStorageKey();
    localStorage.setItem(key, JSON.stringify(cart));
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
    // Reload cart from localStorage for the currently logged-in user.
    syncCart: (state) => {
      state.items = loadCart();
    },
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
    }
  }
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  syncCart,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
