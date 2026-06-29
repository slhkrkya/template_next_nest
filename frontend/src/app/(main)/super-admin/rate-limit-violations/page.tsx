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
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';

interface RateLimitViolation {
  id: string;
  ipAddress: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  dismissed: boolean;
  tenantId?: string;
  tenantName?: string;
  httpMethod?: string;
  policy?: string;
}

interface ViolationFilters {
  endpoint: string;
  ipAddress: string;
  method: string;
  policy: string;
}

const DEFAULT_FILTERS: ViolationFilters = {
  endpoint: '',
  ipAddress: '',
  method: '',
  policy: '',
};

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const POLICIES = ['Global', 'Auth', 'Api', 'Expensive'];

async function getAllViolations(
  dismissed?: boolean,
  filters?: ViolationFilters,
): Promise<RateLimitViolation[]> {
  const params: Record<string, string | boolean | undefined> = {};
  if (dismissed !== undefined) params.dismissed = dismissed;
  if (filters?.endpoint) params.endpoint = filters.endpoint;
  if (filters?.ipAddress) params.ipAddress = filters.ipAddress;
  if (filters?.method) params.method = filters.method;
  if (filters?.policy) params.policy = filters.policy;

  const res = await axiosInstance.get<{ data: (RateLimitViolation & { isDismissed: boolean })[] }>(
    '/super-admin/rate-limit-violations',
    { params },
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

function ViolationFilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: ViolationFilters;
  onChange: (filters: ViolationFilters) => void;
  onReset: () => void;
}) {
  const t = useTranslations('rateLimitViolations');
  const commonT = useTranslations('common');

  function set<K extends keyof ViolationFilters>(key: K, value: ViolationFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const methodOptions = [
    { label: commonT('all'), value: '' },
    ...HTTP_METHODS.map((m) => ({ label: m, value: m })),
  ];

  const policyOptions = [
    { label: commonT('all'), value: '' },
    ...POLICIES.map((p) => ({ label: p, value: p })),
  ];

  return (
    <FilterBar
      actions={
        <Button
          type="button"
          label={commonT('clear')}
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={onReset}
        />
      }
    >
      <FilterField label={t('ipAddress')} htmlFor="filter-ip">
        <InputText
          id="filter-ip"
          value={filters.ipAddress}
          onChange={(e) => set('ipAddress', e.target.value)}
          placeholder="192.168.1.1"
          className="w-full"
        />
      </FilterField>
      <FilterField label={t('endpoint')} htmlFor="filter-endpoint">
        <InputText
          id="filter-endpoint"
          value={filters.endpoint}
          onChange={(e) => set('endpoint', e.target.value)}
          placeholder="/api/..."
          className="w-full"
        />
      </FilterField>
      <FilterField label="Method" htmlFor="filter-method">
        <Dropdown
          inputId="filter-method"
          value={filters.method}
          options={methodOptions}
          onChange={(e) => set('method', e.value ?? '')}
          className="w-full"
          appendTo={getPrimeOverlayAppendTo()}
        />
      </FilterField>
      <FilterField label="Policy" htmlFor="filter-policy">
        <Dropdown
          inputId="filter-policy"
          value={filters.policy}
          options={policyOptions}
          onChange={(e) => set('policy', e.value ?? '')}
          className="w-full"
          appendTo={getPrimeOverlayAppendTo()}
        />
      </FilterField>
    </FilterBar>
  );
}

export default function SuperAdminRateLimitViolationsPage() {
  const t = useTranslations('rateLimitViolations');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'undismissed' | 'dismissed' | 'all'>('undismissed');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [advancedFilters, setAdvancedFilters] = useState<ViolationFilters>(DEFAULT_FILTERS);

  const dismissed = filter === 'undismissed' ? false : filter === 'dismissed' ? true : undefined;
  const filterOptions = [
    { label: t('undismissed'), value: 'undismissed' },
    { label: t('dismissed'), value: 'dismissed' },
    { label: commonT('all'), value: 'all' },
  ];

  const violationsQuery = useQuery({
    queryKey: ['super-admin-rate-limit-violations', filter, advancedFilters],
    queryFn: () => getAllViolations(dismissed, advancedFilters),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissViolation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-rate-limit-violations'] }),
  });

  const bulkDismissMutation = useMutation({
    mutationFn: () => dismissAll(Array.from(selected)),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['super-admin-rate-limit-violations'] });
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
    {
      header: 'Tenant',
      key: 'tenantName',
      className: 'w-40',
      render: (_, row) => (
        <span className="text-sm font-medium">
          {row.tenantName || <span className="text-muted-foreground italic">Global</span>}
        </span>
      ),
    },
    {
      header: t('ipAddress'),
      key: 'ipAddress',
      render: (_, row) => <span className="font-mono font-semibold">{row.ipAddress}</span>,
    },
    {
      header: t('endpoint'),
      key: 'endpoint',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.httpMethod && (
            <Tag value={row.httpMethod} severity="info" className="text-xs" />
          )}
          <span className="line-clamp-1 font-mono text-xs text-primary">{row.endpoint}</span>
        </div>
      ),
    },
    {
      header: 'Policy',
      key: 'policy',
      className: 'w-28',
      render: (_, row) => (
        <Tag
          value={row.policy || 'Global'}
          severity={
            row.policy === 'Auth'
              ? 'danger'
              : row.policy === 'Expensive'
                ? 'warning'
                : 'secondary'
          }
        />
      ),
    },
    {
      header: t('requests'),
      key: 'requestCount',
      className: 'w-28',
      render: (_, row) => (
        <span className="font-semibold tabular-nums">{row.requestCount.toLocaleString()}</span>
      ),
    },
    {
      header: t('severity'),
      key: 'severity',
      className: 'w-28',
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
      className: 'w-40',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(row.windowStart), 'MMM d, HH:mm:ss')}
        </span>
      ),
    },
    {
      header: commonT('status'),
      key: 'dismissed',
      className: 'w-28',
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
          <Button
            type="button"
            label={t('dismiss')}
            size="small"
            severity="warning"
            outlined
            loading={dismissMutation.isPending}
            onClick={() => dismissMutation.mutate(row.id)}
          />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle="View rate limit violations across all tenants. Dismiss resolved incidents."
      />

      <ViolationFilterBar
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        onReset={() => setAdvancedFilters(DEFAULT_FILTERS)}
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
        minWidth="80rem"
        emptyMessage={filter === 'undismissed' ? t('emptyActive') : t('emptyFiltered')}
      />
    </div>
  );
}
