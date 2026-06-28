'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { getPrimeOverlayAppendTo } from './FilterBar';

interface Locale {
  code: string;
  label: string;
  flag: string;
}

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locales: Locale[] = [
    { code: 'en', label: t('english'), flag: 'EN' },
    { code: 'tr', label: t('turkish'), flag: 'TR' },
  ];

  const handleLocaleChange = (nextLocale: string) => {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    });
  };

  return (
    <Dropdown
      value={locale}
      options={locales}
      optionLabel="label"
      optionValue="code"
      onChange={(event) => handleLocaleChange(event.value)}
      disabled={isPending}
      className="w-28"
      aria-label={t('switch')}
      appendTo={getPrimeOverlayAppendTo()}
      valueTemplate={(option: Locale | null) => (
        <span className="font-bold tracking-wide">{option?.flag ?? 'EN'}</span>
      )}
      itemTemplate={(option: Locale) => (
        <span className="flex items-center gap-2">
          <span className="w-6 text-xs font-bold">{option.flag}</span>
          <span>{option.label}</span>
        </span>
      )}
    />
  );
}
