'use client';

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { Toast } from 'primereact/toast';

type ToastVariant = 'default' | 'success' | 'info' | 'warning' | 'destructive';

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface AppToastContextValue {
  toast: (input: ToastInput) => void;
}

const AppToastContext = createContext<AppToastContextValue | null>(null);

const severityMap: Record<ToastVariant, 'success' | 'info' | 'warn' | 'error'> = {
  default: 'info',
  success: 'success',
  info: 'info',
  warning: 'warn',
  destructive: 'error',
};

export function useAppToast() {
  const context = useContext(AppToastContext);

  if (!context) {
    throw new Error('useAppToast must be used within PrimeProvider');
  }

  return context;
}

export function PrimeProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const value = useMemo<AppToastContextValue>(
    () => ({
      toast: ({ title, description, variant = 'default' }) => {
        toastRef.current?.show({
          severity: severityMap[variant],
          summary: title,
          detail: description,
          life: variant === 'destructive' ? 5000 : 3500,
        });
      },
    }),
    [],
  );

  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <AppToastContext.Provider value={value}>
        <Toast ref={toastRef} position="top-right" />
        {children}
      </AppToastContext.Provider>
    </PrimeReactProvider>
  );
}
