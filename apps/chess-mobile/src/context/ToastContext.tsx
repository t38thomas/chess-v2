import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'malus' | 'bonus';

export interface ToastData {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    type?: ToastType;
    duration?: number; // ms, default 3000
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastContextType {
    showToast: (toast: Omit<ToastData, 'id'>) => void;
    dismissToast: (id: string) => void;
    toasts: ToastData[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const toastIdCounter = useRef(0);

    const dismissToast = useCallback((id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setToasts(current => current.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
        console.log('[ToastProvider] showToast called', toastData);
        const id = `toast-${Date.now()}-${toastIdCounter.current++}`;
        const duration = toastData.duration ?? 4000;

        const newToast: ToastData = { ...toastData, id, duration };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setToasts(current => [...current, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
            {children}
        </ToastContext.Provider>
    );
};
