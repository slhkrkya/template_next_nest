'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';

interface ThemeToggleProps {
  variant?: 'icon-only' | 'labeled';
}

export function ThemeToggle({ variant = 'icon-only' }: ThemeToggleProps) {
  const t = useTranslations('theme');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const themeOptions = [
    { label: t('light'), value: 'light' },
    { label: t('dark'), value: 'dark' },
    { label: t('system'), value: 'system' },
  ];

  if (variant === 'labeled') {
    return (
      <SelectButton
        value={theme ?? 'system'}
        options={themeOptions}
        onChange={(event) => event.value && setTheme(event.value)}
        allowEmpty={false}
        aria-label={t('theme')}
      />
    );
  }

  return (
    <Button
      type="button"
      icon={isDark ? 'pi pi-moon' : 'pi pi-sun'}
      severity="secondary"
      text
      rounded
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('toLight') : t('toDark')}
    />
  );
}
