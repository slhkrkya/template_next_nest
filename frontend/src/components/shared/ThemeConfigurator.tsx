'use client';

import { useRef, useState } from 'react';
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
  normalizeThemePreference,
  useThemeStore,
} from '@/store/theme.store';
import type { UserThemePreference } from '@/types';

interface ThemeConfiguratorProps {
  visible: boolean;
  onHide: () => void;
}

const SAVE_DEBOUNCE_MS = 600;

export function ThemeConfigurator({ visible, onHide }: ThemeConfiguratorProps) {
  const t = useTranslations('theme');
  const { toast } = useAppToast();
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<UserThemePreference | null>(null);
  const versionRef = useRef(0);
  const { preference, setPreference } = useThemeStore();
  const updateUser = useAuthStore((s) => s.updateUser);

  const colorSchemeOptions = COLOR_SCHEME_OPTIONS.map((o) => ({
    ...o,
    label: o.value === 'dark' ? t('dark') : t('light'),
  }));
  const inputStyleOptions = INPUT_STYLE_OPTIONS.map((o) => ({
    ...o,
    label: o.value === 'filled' ? t('inputStyle.filled') : t('inputStyle.outlined'),
  }));

  function persist(partial: Partial<UserThemePreference>) {
    const next = normalizeThemePreference({ ...useThemeStore.getState().preference, ...partial });
    setPreference(next);
    updateUser({ themePreference: next });

    const version = ++versionRef.current;
    pendingRef.current = next;
    setIsSaving(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      const pref = pendingRef.current;
      if (!pref) return;
      try {
        const saved = await updateThemePreference(pref);
        if (version === versionRef.current) {
          pendingRef.current = null;
          useThemeStore.getState().setPreference(saved);
          updateUser({ themePreference: saved });
        }
      } catch {
        if (version === versionRef.current) {
          toast({ title: t('saveFailed'), variant: 'destructive' });
        }
      } finally {
        if (version === versionRef.current) setIsSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);
  }

  return (
    <PrimeSidebar
      visible={visible}
      position="right"
      onHide={onHide}
      className="w-72"
      header={
        <div className="flex items-center gap-2">
          <i className="pi pi-palette text-primary" />
          <span className="font-bold">{t('theme')}</span>
          {isSaving && <i className="pi pi-spin pi-spinner ml-auto text-sm text-muted-foreground" />}
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t('darkMode')}
          </p>
          <SelectButton
            value={preference.colorScheme}
            options={colorSchemeOptions}
            allowEmpty={false}
            className="w-full"
            onChange={(e) => e.value && persist({ colorScheme: e.value })}
          />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('scale')}
            </p>
            <span className="text-xs font-semibold text-foreground">{preference.scale}px</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button" icon="pi pi-minus" text rounded severity="secondary"
              disabled={preference.scale <= SCALE_OPTIONS[0]}
              onClick={() => persist({ scale: preference.scale - 1 })}
              aria-label={t('decreaseScale')}
            />
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {SCALE_OPTIONS.map((s) => (
                <button
                  key={s} type="button"
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${preference.scale === s ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => persist({ scale: s })}
                  aria-label={t('setScale', { scale: s })}
                />
              ))}
            </div>
            <Button
              type="button" icon="pi pi-plus" text rounded severity="secondary"
              disabled={preference.scale >= SCALE_OPTIONS[SCALE_OPTIONS.length - 1]}
              onClick={() => persist({ scale: preference.scale + 1 })}
              aria-label={t('increaseScale')}
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t('inputStyle.title')}
          </p>
          <SelectButton
            value={preference.inputStyle}
            options={inputStyleOptions}
            allowEmpty={false}
            className="w-full"
            onChange={(e) => e.value && persist({ inputStyle: e.value })}
          />
        </section>

        <section>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('rippleEffect')}
            </p>
            <InputSwitch
              checked={preference.ripple}
              onChange={(e) => persist({ ripple: !!e.value })}
            />
          </div>
        </section>
      </div>
    </PrimeSidebar>
  );
}
