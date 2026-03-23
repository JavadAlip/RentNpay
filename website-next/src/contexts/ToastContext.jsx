'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const pushToast = useCallback((message, type = 'error', durationMs = 3000) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timeoutsRef.current.delete(id);
    }, durationMs);

    timeoutsRef.current.set(id, t);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-24px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'rounded-xl border px-4 py-3 shadow-lg text-sm',
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : t.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-800',
            ].join(' ')}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

