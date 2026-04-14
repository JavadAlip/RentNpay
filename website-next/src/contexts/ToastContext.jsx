'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const pushToast = useCallback(
    (message, type = 'error', durationMs = 3000) => {
      const fn =
        type === 'success'
          ? toast.success
          : type === 'warning'
            ? toast.warning
            : toast.error;
      fn(message, {
        autoClose: durationMs,
        position: 'top-right',
        pauseOnHover: true,
        closeOnClick: true,
      });
    },
    [],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        newestOnTop
        theme="colored"
        toastStyle={{ borderRadius: 12 }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
