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

    // Backward compatibility:
    // Old cart stored rental months in `quantity`.
    // New cart stores:
    // - `quantity` = number of units (stock units)
    // - `rentalMonths` = tenure selected on product page
    const normalizeItem = (it) => {
      if (!it) return it;
      let next = it;
      if (it.rentalMonths == null && it.quantity != null) {
        const rentalMonths = it.quantity;
        next = { ...it, rentalMonths: rentalMonths || 1, quantity: 1 };
      }
      const tu = next.tenureUnit;
      if (tu !== 'day' && tu !== 'month') {
        next = { ...next, tenureUnit: 'month' };
      }
      return next;
    };

    const normalizeList = (list) =>
      Array.isArray(list) ? list.map(normalizeItem) : [];

    // If we were using the guest cart and the user just logged in,
    // merge guest items into the user cart so checkout doesn't lose items.
    if (key !== 'rentpay_cart_guest') {
      const guestStr = localStorage.getItem('rentpay_cart_guest');
      if (guestStr) {
        const guestItems = JSON.parse(guestStr) || [];
        const userStr = localStorage.getItem(key);
        const userItems = userStr ? JSON.parse(userStr) : [];

        if (Array.isArray(guestItems) && guestItems.length > 0) {
          const merged = [...userItems];
          guestItems.forEach((gi) => {
            const existing = merged.find((mi) => mi.productId === gi.productId);
            if (existing)
              existing.quantity = (existing.quantity || 0) + (gi.quantity || 1);
            else merged.push(gi);
          });

          localStorage.setItem(key, JSON.stringify(merged));
          localStorage.removeItem('rentpay_cart_guest');
          return normalizeList(merged);
        }
      }
    }

    const s = localStorage.getItem(key);
    return s ? normalizeList(JSON.parse(s)) : [];
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
      const {
        productId,
        quantity = 1,
        rentalMonths = 1,
        pricePerDay,
        title,
        image,
        tenureUnit = 'month',
      } = payload;
      const tu = tenureUnit === 'day' ? 'day' : 'month';
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) existing.quantity += quantity;
      else
        state.items.push({
          productId,
          quantity,
          rentalMonths,
          pricePerDay,
          title,
          image,
          tenureUnit: tu,
        });

      if (existing) {
        existing.rentalMonths = rentalMonths;
        existing.tenureUnit = tu;
      }
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
        state.items = state.items.filter(
          (i) => i.productId !== payload.productId,
        );
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
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  syncCart,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
