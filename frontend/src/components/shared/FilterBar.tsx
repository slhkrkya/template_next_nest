'use client';

import type { ReactNode } from 'react';
import { classNames } from 'primereact/utils';

interface FilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

interface FilterFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function getPrimeOverlayAppendTo(): HTMLElement | undefined {
  return typeof document === 'undefined' ? undefined : document.body;
}

export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <div
      className={classNames(
        'mb-5 grid gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end',
        className,
      )}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
        {children}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:justify-end">{actions}</div>}
    </div>
  );
}

export function FilterField({ label, htmlFor, children, className }: FilterFieldProps) {
  return (
    <div className={classNames('min-w-0', className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
