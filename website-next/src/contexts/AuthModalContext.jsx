'use client';

import { createContext, useCallback, useContext, useState } from 'react';

export const HOME_AUTH_PROMPT_SESSION_KEY = 'home_auth_prompted';
export const AUTH_REDIRECT_SESSION_KEY = 'rentpay_auth_redirect';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('login');

  const openAuth = useCallback((initialView = 'login') => {
    setView(initialView);
    setOpen(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(HOME_AUTH_PROMPT_SESSION_KEY, '1');
    }
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider value={{ open, view, openAuth, closeAuth }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error('useAuthModal must be used inside <AuthModalProvider>');
  return ctx;
}
