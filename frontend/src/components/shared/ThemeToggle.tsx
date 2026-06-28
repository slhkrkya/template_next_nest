'use client';

import { useTranslations } from 'next-intl';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { updateThemePreference } from '@/lib/api/users.api';
import { useAuthStore } from '@/store/auth.store';
import { COLOR_SCHEME_OPTIONS, useThemeStore } from '@/store/theme.store';
import type { ColorScheme } from '@/types';

interface ThemeToggleProps {
  variant?: 'icon-only' | 'labeled';
}

export function ThemeToggle({ variant = 'icon-only' }: ThemeToggleProps) {
  const t = useTranslations('theme');
  const { preference, updatePreference } = useThemeStore();
  const updateUser = useAuthStore((state) => state.updateUser);
  const isDark = preference.colorScheme === 'dark';

  async function setColorScheme(colorScheme: ColorScheme) {
    const next = updatePreference({ colorScheme });
    updateUser({ themePreference: next });

    try {
      const saved = await updateThemePreference({ colorScheme });
      useThemeStore.getState().setPreference(saved);
      updateUser({ themePreference: saved });
    } catch {
      // Keep the optimistic UI state; the backend value will be restored on next login if saving fails.
    }
  }

  if (variant === 'labeled') {
    const colorSchemeOptions = COLOR_SCHEME_OPTIONS.map((option) => ({
      ...option,
      label: option.value === 'dark' ? t('dark') : t('light'),
    }));

    return (
      <SelectButton
        value={preference.colorScheme}
        options={colorSchemeOptions}
        onChange={(event) => event.value && setColorScheme(event.value)}
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
      onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('toLight') : t('toDark')}
    />
  );
}
