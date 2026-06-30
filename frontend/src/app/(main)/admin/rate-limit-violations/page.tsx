'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

interface RateLimitViolation {
  id: string;
  ipAddress: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  dismissed: boolean;
}

async function getViolations(dismissed?: boolean): Promise<RateLimitViolation[]> {
  const res = await axiosInstance.get<{ data: (RateLimitViolation & { isDismissed: boolean })[] }>(
    '/rate-limit-violations',
    { params: dismissed !== undefined ? { dismissed } : {} },
  );
  return res.data.data.map((v) => ({ ...v, dismissed: v.isDismissed }));
}

async function dismissViolation(id: string): Promise<void> {
  await axiosInstance.patch(`/rate-limit-violations/${id}/dismiss`);
}

async function dismissAll(ids: string[]): Promise<void> {
  await axiosInstance.post('/rate-limit-violations/bulk-dismiss', { ids });
}

function severityFor(count: number) {
  if (count >= 1000) return { key: 'critical', severity: 'danger' as const };
  if (count >= 500) return { key: 'high', severity: 'warning' as const };
  if (count >= 100) return { key: 'medium', severity: 'info' as const };
  return { key: 'low', severity: 'secondary' as const };
}

export default function RateLimitViolationsPage() {
  const t = useTranslations('rateLimitViolations');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'undismissed' | 'dismissed' | 'all'>('undismissed');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const dismissed = filter === 'undismissed' ? false : filter === 'dismissed' ? true : undefined;
  const filterOptions = [
    { label: t('undismissed'), value: 'undismissed' },
    { label: t('dismissed'), value: 'dismissed' },
    { label: commonT('all'), value: 'all' },
  ];

  const violationsQuery = useQuery({
    queryKey: ['rate-limit-violations', filter],
    queryFn: () => getViolations(dismissed),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissViolation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] }),
  });

  const bulkDismissMutation = useMutation({
    mutationFn: () => dismissAll(Array.from(selected)),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['rate-limit-violations'] });
    },
  });

  const violations = violationsQuery.data ?? [];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === violations.length ? new Set() : new Set(violations.map((violation) => violation.id)),
    );
  };

  const columns: Column<RateLimitViolation>[] = [
    {
      header: '',
      key: 'select',
      className: 'w-12',
      render: (_, row) => (
        <Checkbox
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          aria-label={t('selectViolation')}
        />
      ),
    },
    { header: t('ipAddress'), key: 'ipAddress', render: (_, row) => <span className="font-mono font-semibold">{row.ipAddress}</span> },
    { header: t('endpoint'), key: 'endpoint', render: (_, row) => <span className="line-clamp-1 font-mono text-xs text-primary">{row.endpoint}</span> },
    {
      header: t('requests'),
      key: 'requestCount',
      render: (_, row) => (
        <span className="font-semibold tabular-nums">{row.requestCount.toLocaleString()}</span>
      ),
    },
    {
      header: t('severity'),
      key: 'severity',
      render: (_, row) => {
        const severity = severityFor(row.requestCount);
        const label = {
          critical: t('severityLevels.critical'),
          high: t('severityLevels.high'),
          medium: t('severityLevels.medium'),
          low: t('severityLevels.low'),
        }[severity.key];

        return <Tag value={label} severity={severity.severity} />;
      },
    },
    {
      header: t('time'),
      key: 'windowStart',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(row.windowStart), 'MMM d, HH:mm:ss')}
        </span>
      ),
    },
    {
      header: commonT('status'),
      key: 'dismissed',
      render: (_, row) => (
        <Tag value={row.dismissed ? t('dismissed') : commonT('active')} severity={row.dismissed ? 'secondary' : 'danger'} />
      ),
    },
    {
      header: commonT('actions'),
      key: 'id',
      className: 'w-28',
      render: (_, row) =>
        row.dismissed ? null : (
          <PermissionGuard entity="RateLimits" action="delete">
            <Button
              type="button"
              label={t('dismiss')}
              size="small"
              severity="warning"
              outlined
              loading={dismissMutation.isPending}
              onClick={() => dismissMutation.mutate(row.id)}
            />
          </PermissionGuard>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <FilterBar
        actions={
          <>
            <span className="text-sm text-muted-foreground">{t('selected', { count: selected.size })}</span>
            <Button
              type="button"
              label={t('dismissSelected')}
              icon="pi pi-check"
              severity="warning"
              disabled={selected.size === 0}
              loading={bulkDismissMutation.isPending}
              onClick={() => bulkDismissMutation.mutate()}
            />
          </>
        }
      >
        <FilterField label={t('selection')}>
          <div className="flex min-h-[2.5rem] items-center gap-2 rounded-md border border-input px-3">
            <Checkbox
              inputId="select-all-violations"
              checked={violations.length > 0 && selected.size === violations.length}
              onChange={toggleAll}
            />
            <label htmlFor="select-all-violations" className="text-sm font-semibold text-muted-foreground">
              {t('selectAll')}
            </label>
          </div>
        </FilterField>
        <FilterField label={commonT('status')}>
          <SelectButton
            value={filter}
            options={filterOptions}
            onChange={(event) => {
              if (event.value) {
                setFilter(event.value);
                setSelected(new Set());
              }
            }}
            allowEmpty={false}
            className="w-full"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={violations}
        isLoading={violationsQuery.isLoading}
        minWidth="60rem"
        emptyMessage={filter === 'undismissed' ? t('emptyActive') : t('emptyFiltered')}
      />
    </div>
  );
}
