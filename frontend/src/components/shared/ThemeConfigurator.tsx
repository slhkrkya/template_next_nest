'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { useTranslations } from 'next-intl';
import { updateThemePreference } from '@/lib/api/users.api';
import { useAppToast } from '@/providers/prime-provider';
import { useAuthStore } from '@/store/auth.store';
import {
  COLOR_SCHEME_OPTIONS,
  INPUT_STYLE_OPTIONS,
  SCALE_OPTIONS,
  groupThemeOptions,
  useThemeStore,
} from '@/store/theme.store';
import type { UserThemePreference } from '@/types';

interface ThemeConfiguratorProps {
  visible: boolean;
  onHide: () => void;
}

export function ThemeConfigurator({ visible, onHide }: ThemeConfiguratorProps) {
  const t = useTranslations('theme');
  const { toast } = useAppToast();
  const [isSaving, setIsSaving] = useState(false);
  const { preference, updatePreference } = useThemeStore();
  const updateUser = useAuthStore((state) => state.updateUser);
  const themeGroups = groupThemeOptions();
  const inputStyleOptions = INPUT_STYLE_OPTIONS.map((option) => ({
    ...option,
    label: option.value === 'filled' ? t('inputStyle.filled') : t('inputStyle.outlined'),
  }));
  const colorSchemeOptions = COLOR_SCHEME_OPTIONS.map((option) => ({
    ...option,
    label: option.value === 'dark' ? t('dark') : t('light'),
  }));

  async function persistPreference(partial: Partial<UserThemePreference>) {
    const next = updatePreference(partial);
    updateUser({ themePreference: next });
    setIsSaving(true);

    try {
      const saved = await updateThemePreference(next);
      useThemeStore.getState().setPreference(saved);
      updateUser({ themePreference: saved });
    } catch {
      toast({
        title: t('saveFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PrimeSidebar
      visible={visible}
      position="right"
      onHide={onHide}
      className="w-full max-w-[24rem]"
      header={
        <div className="flex items-center gap-2">
          <i className="pi pi-palette text-primary" />
          <span className="font-bold">{t('theme')}</span>
        </div>
      }
    >
      <div className="space-y-6 pb-4">
        <section className="border-b border-border pb-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-semibold text-foreground">{t('scale')}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                icon="pi pi-minus"
                text
                rounded
                severity="secondary"
                disabled={preference.scale <= SCALE_OPTIONS[0]}
                onClick={() => persistPreference({ scale: preference.scale - 1 })}
                aria-label={t('decreaseScale')}
              />
              <div className="flex items-center gap-1 px-1">
                {SCALE_OPTIONS.map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    className={`h-3 w-3 rounded-full transition-colors ${
                      preference.scale === scale ? 'bg-primary' : 'bg-muted'
                    }`}
                    onClick={() => persistPreference({ scale })}
                    aria-label={t('setScale', { scale })}
                  />
                ))}
              </div>
              <Button
                type="button"
                icon="pi pi-plus"
                text
                rounded
                severity="secondary"
                disabled={preference.scale >= SCALE_OPTIONS[SCALE_OPTIONS.length - 1]}
                onClick={() => persistPreference({ scale: preference.scale + 1 })}
                aria-label={t('increaseScale')}
              />
            </div>
          </div>
        </section>

        <section className="border-b border-border pb-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="font-semibold text-foreground">{t('inputStyle.title')}</span>
            <SelectButton
              value={preference.inputStyle}
              options={inputStyleOptions}
              allowEmpty={false}
              onChange={(event) => event.value && persistPreference({ inputStyle: event.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-foreground">{t('rippleEffect')}</span>
            <InputSwitch
              checked={preference.ripple}
              onChange={(event) => persistPreference({ ripple: !!event.value })}
            />
          </div>
        </section>

        <section className="border-b border-border pb-5">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-foreground">{t('darkMode')}</span>
            <SelectButton
              value={preference.colorScheme}
              options={colorSchemeOptions}
              allowEmpty={false}
              onChange={(event) => event.value && persistPreference({ colorScheme: event.value })}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold text-foreground">{t('themes')}</span>
            {isSaving && <i className="pi pi-spin pi-spinner text-sm text-muted-foreground" />}
          </div>

          <div className="space-y-5">
            {Object.entries(themeGroups).map(([label, options]) => (
              <div key={label} className="border-b border-border pb-5 last:border-b-0">
                <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {label.charAt(0)}
                  </span>
                  <span>{label}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {options.map((option) => {
                    const selected =
                      preference.themeFamily === option.family
                      && preference.themeName === option.name;

                    return (
                      <button
                        key={`${option.family}-${option.name}`}
                        type="button"
                        className={`flex h-8 items-center justify-center rounded-full border bg-card transition-colors ${
                          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                        }`}
                        onClick={() => persistPreference({
                          themeFamily: option.family,
                          themeName: option.name,
                        })}
                        aria-label={`${label} ${option.name}`}
                        title={`${label} ${option.name}`}
                      >
                        <span
                          className="h-3 w-10 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PrimeSidebar>
  );
}
