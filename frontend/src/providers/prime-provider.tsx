'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { PrimeReactContext, PrimeReactProvider } from 'primereact/api';
import { Toast } from 'primereact/toast';
import { getThemeAssetName, useThemeStore } from '@/store/theme.store';

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
const PRIME_DEFAULT_THEME = 'lara-light-indigo';

function getThemeHref(theme: string) {
  return `/primereact-themes/${theme}/theme.css`;
}

function parseComputedRgb(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const parts = match[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return [parts[0], parts[1], parts[2]];
}

function resolveColor(value: string): [number, number, number] | null {
  if (!value || typeof document === 'undefined') return null;

  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  return parseComputedRgb(computed);
}

function rgbToHsl([red, green, blue]: [number, number, number]) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }

    hue *= 60;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function readPrimeToken(styles: CSSStyleDeclaration, ...names: string[]) {
  for (const name of names) {
    const value = styles.getPropertyValue(name).trim();
    if (value) return value;
  }

  return '';
}

function setThemeToken(root: HTMLElement, name: string, value: string, fallback: string) {
  const rgb = resolveColor(value);
  root.style.setProperty(name, rgb ? rgbToHsl(rgb) : fallback);
}

function syncPrimeThemeTokens() {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const isDark = root.classList.contains('dark');
  const primary = readPrimeToken(styles, '--primary-color', '--primary-500');
  const primaryText = readPrimeToken(styles, '--primary-color-text');
  const surfaceGround = readPrimeToken(styles, '--surface-ground', '--surface-50');
  const surfaceCard = readPrimeToken(styles, '--surface-card', '--surface-0');
  const surfaceBorder = readPrimeToken(styles, '--surface-border', '--surface-200');
  const surfaceMuted = readPrimeToken(styles, '--surface-100', '--surface-hover');
  const textColor = readPrimeToken(styles, '--text-color');
  const textMuted = readPrimeToken(styles, '--text-color-secondary');

  setThemeToken(root, '--primary', primary, isDark ? '217 91% 60%' : '238 78% 58%');
  setThemeToken(root, '--primary-foreground', primaryText || '#ffffff', isDark ? '222 47% 11%' : '210 40% 98%');
  setThemeToken(root, '--ring', primary, isDark ? '217 91% 60%' : '238 78% 58%');
  setThemeToken(root, '--background', surfaceGround, isDark ? '229 40% 8%' : '220 38% 97%');
  setThemeToken(root, '--foreground', textColor, isDark ? '210 40% 98%' : '225 36% 10%');
  setThemeToken(root, '--card', surfaceCard, isDark ? '222 84% 5%' : '0 0% 100%');
  setThemeToken(root, '--card-foreground', textColor, isDark ? '210 40% 98%' : '222 84% 5%');
  setThemeToken(root, '--popover', surfaceCard, isDark ? '222 84% 5%' : '0 0% 100%');
  setThemeToken(root, '--popover-foreground', textColor, isDark ? '210 40% 98%' : '222 84% 5%');
  setThemeToken(root, '--secondary', surfaceMuted, isDark ? '217 33% 18%' : '210 40% 96%');
  setThemeToken(root, '--secondary-foreground', textColor, isDark ? '210 40% 98%' : '222 47% 11%');
  setThemeToken(root, '--muted', surfaceMuted, isDark ? '217 33% 18%' : '210 40% 96%');
  setThemeToken(root, '--muted-foreground', textMuted, isDark ? '215 20% 65%' : '215 16% 47%');
  setThemeToken(root, '--accent', readPrimeToken(styles, '--highlight-bg', '--surface-hover', '--surface-100'), isDark ? '217 33% 18%' : '210 40% 96%');
  setThemeToken(root, '--accent-foreground', readPrimeToken(styles, '--highlight-text-color', '--text-color'), isDark ? '210 40% 98%' : '222 47% 11%');
  setThemeToken(root, '--border', surfaceBorder, isDark ? '217 33% 18%' : '214 32% 91%');
  setThemeToken(root, '--input', surfaceBorder, isDark ? '217 33% 18%' : '214 32% 91%');
  setThemeToken(root, '--sidebar-background', surfaceCard, isDark ? '232 45% 11%' : '0 0% 100%');
  setThemeToken(root, '--sidebar-foreground', textColor, isDark ? '210 40% 98%' : '225 36% 10%');
  setThemeToken(root, '--sidebar-primary', primary, isDark ? '217 91% 60%' : '238 78% 58%');
  setThemeToken(root, '--sidebar-primary-foreground', primaryText || '#ffffff', isDark ? '222 47% 11%' : '210 40% 98%');
  setThemeToken(root, '--sidebar-accent', readPrimeToken(styles, '--highlight-bg', '--surface-hover', '--surface-100'), isDark ? '217 33% 18%' : '210 40% 96%');
  setThemeToken(root, '--sidebar-accent-foreground', readPrimeToken(styles, '--highlight-text-color', '--text-color'), isDark ? '210 40% 98%' : '222 47% 11%');
  setThemeToken(root, '--sidebar-border', surfaceBorder, isDark ? '217 33% 18%' : '214 32% 91%');
  setThemeToken(root, '--sidebar-ring', primary, isDark ? '217 91% 60%' : '238 78% 58%');
}

function PrimeThemeSynchronizer() {
  const { setTheme } = useTheme();
  const primeReact = useContext(PrimeReactContext);
  const preference = useThemeStore((state) => state.preference);
  const currentThemeRef = useRef(PRIME_DEFAULT_THEME);

  useEffect(() => {
    const nextTheme = getThemeAssetName(preference);
    const linkElement = document.getElementById(PRIME_THEME_LINK_ID) as HTMLLinkElement | null;

    if (!linkElement) return;

    const activeTheme = currentThemeRef.current;

    if (activeTheme === nextTheme) {
      currentThemeRef.current = nextTheme;
    } else {
      try {
        primeReact.changeTheme?.(activeTheme, nextTheme, PRIME_THEME_LINK_ID);
      } catch {
        linkElement.href = getThemeHref(nextTheme);
      }

      currentThemeRef.current = nextTheme;
    }

    primeReact.setInputStyle?.(preference.inputStyle);
    primeReact.setRipple?.(preference.ripple);
    setTheme(preference.colorScheme);
    document.documentElement.style.fontSize = `${preference.scale}px`;

    window.setTimeout(syncPrimeThemeTokens, 0);
    linkElement.addEventListener('load', syncPrimeThemeTokens, { once: true });

    return () => {
      linkElement.removeEventListener('load', syncPrimeThemeTokens);
    };
  }, [preference, primeReact, setTheme]);

  return null;
}

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
    <PrimeReactProvider value={{ ripple: true, inputStyle: 'outlined' }}>
      <AppToastContext.Provider value={value}>
        <PrimeThemeSynchronizer />
        <Toast ref={toastRef} position="top-right" />
        {children}
      </AppToastContext.Provider>
    </PrimeReactProvider>
  );
}
