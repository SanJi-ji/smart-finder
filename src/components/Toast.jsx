import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Toast Context + Hook ─────────────────────────────────────────────────────
// Usage: const { showToast } = useToast();
//        showToast('Item approved!', 'success');   // 'success' | 'error' | 'info'

import { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`toast toast-${t.type}`}
                        role="alert"
                        onClick={() => dismiss(t.id)}
                    >
                        <span className="toast-icon">
                            {t.type === 'success' && '✅'}
                            {t.type === 'error'   && '❌'}
                            {t.type === 'info'    && 'ℹ️'}
                        </span>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
