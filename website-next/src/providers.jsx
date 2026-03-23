'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store';
import { rehydrateAuth } from '@/store/slices/authSlice';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Rehydrates auth from localStorage on first render
function AuthRehydrator({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(rehydrateAuth());
  }, [dispatch]);
  return children;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthRehydrator>
        <AuthModalProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthModalProvider>
      </AuthRehydrator>
    </Provider>
  );
}
