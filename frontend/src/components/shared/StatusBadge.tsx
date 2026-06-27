'use client';

import { Tag } from 'primereact/tag';
import { useTranslations } from 'next-intl';

type StatusVariant =
  | 'ACTIVE'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'DELETED'
  | 'PENDING'
  | 'INACTIVE'
  | 'BANNED'
  | 'EXPIRED'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { key: string; severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' }
> = {
  ACTIVE: {
    key: 'ACTIVE',
    severity: 'success',
  },
  TRIAL: {
    key: 'TRIAL',
    severity: 'info',
  },
  SUSPENDED: {
    key: 'SUSPENDED',
    severity: 'warning',
  },
  DELETED: {
    key: 'DELETED',
    severity: 'danger',
  },
  PENDING: {
    key: 'PENDING',
    severity: 'warning',
  },
  INACTIVE: {
    key: 'INACTIVE',
    severity: 'secondary',
  },
  BANNED: {
    key: 'BANNED',
    severity: 'danger',
  },
  EXPIRED: {
    key: 'EXPIRED',
    severity: 'secondary',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const t = useTranslations('status');
  const config = statusConfig[status.toUpperCase()] ?? {
    key: status,
    severity: 'secondary' as const,
  };

  return (
    <Tag
      value={label ?? (statusConfig[status.toUpperCase()] ? t(config.key) : status)}
      severity={config.severity}
      className={className}
      rounded
    />
  );
}
