import { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSaving = useCallback(() => {
        return addToast('Saving...', 'loading', 0);
    }, [addToast]);

    const showSaved = useCallback((loadingId) => {
        if (loadingId) removeToast(loadingId);
        addToast('Saved successfully', 'success', 2000);
    }, [addToast, removeToast]);

    const showError = useCallback((message = 'Error saving data') => {
        addToast(message, 'error', 4000);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, showSaving, showSaved, showError }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function Toast({ message, type, onClose }) {
    const icons = {
        success: <Check size={20} style={{ color: 'var(--success)' }} />,
        error: <X size={20} style={{ color: 'var(--error)' }} />,
        warning: <AlertCircle size={20} style={{ color: 'var(--warning)' }} />,
        loading: <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />,
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span style={{ fontSize: '0.875rem' }}>{message}</span>
            {type !== 'loading' && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        marginLeft: 'auto',
                    }}
                >
                    <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
            )}
        </div>
    );
}
