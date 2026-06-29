'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { PrimeReactContext, PrimeReactProvider } from 'primereact/api';
import { Toast } from 'primereact/toast';
import { useThemeStore } from '@/store/theme.store';

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

const PRIME_THEME_LINK_ID = 'primereact-theme';
const PRIME_THEMES = {
  light: 'lara-light-green',
  dark: 'lara-dark-green',
} as const;

function PrimeThemeSynchronizer() {
  const { setTheme } = useTheme();
  const primeReact = useContext(PrimeReactContext);
  const { colorScheme, inputStyle, ripple, scale } = useThemeStore((s) => s.preference);
  const currentThemeRef = useRef<string>(PRIME_THEMES.light);

  useEffect(() => {
    const nextTheme = colorScheme === 'dark' ? PRIME_THEMES.dark : PRIME_THEMES.light;
    const linkElement = document.getElementById(PRIME_THEME_LINK_ID) as HTMLLinkElement | null;

    if (linkElement && currentThemeRef.current !== nextTheme) {
      try {
        primeReact.changeTheme?.(currentThemeRef.current, nextTheme, PRIME_THEME_LINK_ID);
      } catch {
        linkElement.href = `/primereact-themes/${nextTheme}/theme.css`;
      }
      currentThemeRef.current = nextTheme;
    }

    primeReact.setInputStyle?.(inputStyle);
    primeReact.setRipple?.(ripple);
    setTheme(colorScheme);
    document.documentElement.style.fontSize = `${scale}px`;
  }, [colorScheme, inputStyle, ripple, scale, primeReact, setTheme]);

  return null;
}

export function useAppToast() {
  const context = useContext(AppToastContext);
  if (!context) throw new Error('useAppToast must be used within PrimeProvider');
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
    <PrimeReactProvider value={{ ripple: true, inputStyle: 'outlined' }}>
      <AppToastContext.Provider value={value}>
        <PrimeThemeSynchronizer />
        <Toast ref={toastRef} position="top-right" />
        {children}
      </AppToastContext.Provider>
    </PrimeReactProvider>
  );
}
