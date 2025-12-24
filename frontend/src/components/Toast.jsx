import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', timeout = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type }]);
    if (timeout > 0) setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), timeout);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  // expose a tiny global convenience wrapper for legacy code paths
  // (so we can replace many alerts quickly). New components should use useToast().
  if (typeof window !== 'undefined') {
    window.__toast = window.__toast || { add: add, remove: remove };
  }

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="toasts-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
            <button className="toast-close" onClick={() => remove(toast.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
