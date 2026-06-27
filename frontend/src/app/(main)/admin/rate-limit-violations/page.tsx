'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';

interface RateLimitViolation {
  id: string;
  ipAddress: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  dismissed: boolean;
}

const filterOptions = [
  { label: 'Undismissed', value: 'undismissed' },
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'All', value: 'all' },
];

async function getViolations(dismissed?: boolean): Promise<RateLimitViolation[]> {
  const qs = dismissed !== undefined ? `?dismissed=${dismissed}` : '';
  const res = await fetch(`/api/admin/rate-limit-violations${qs}`);
  if (!res.ok) throw new Error('Failed to fetch violations');
  return res.json();
}

async function dismissViolation(id: string): Promise<void> {
  const res = await fetch(`/api/admin/rate-limit-violations/${id}/dismiss`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to dismiss');
}

async function dismissAll(ids: string[]): Promise<void> {
  const res = await fetch('/api/admin/rate-limit-violations/dismiss-bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to dismiss');
}

function severityFor(count: number) {
  if (count >= 1000) return { label: 'Critical', severity: 'danger' as const };
  if (count >= 500) return { label: 'High', severity: 'warning' as const };
  if (count >= 100) return { label: 'Medium', severity: 'info' as const };
  return { label: 'Low', severity: 'secondary' as const };
}

export default function RateLimitViolationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'undismissed' | 'dismissed' | 'all'>('undismissed');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const dismissed = filter === 'undismissed' ? false : filter === 'dismissed' ? true : undefined;

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
          aria-label="Select violation"
        />
      ),
    },
    { header: 'IP Address', key: 'ipAddress', render: (_, row) => <span className="font-mono font-semibold">{row.ipAddress}</span> },
    { header: 'Endpoint', key: 'endpoint', render: (_, row) => <span className="line-clamp-1 font-mono text-xs text-indigo-600">{row.endpoint}</span> },
    {
      header: 'Requests',
      key: 'requestCount',
      render: (_, row) => (
        <span className="font-semibold tabular-nums">{row.requestCount.toLocaleString()}</span>
      ),
    },
    {
      header: 'Severity',
      key: 'severity',
      render: (_, row) => {
        const severity = severityFor(row.requestCount);
        return <Tag value={severity.label} severity={severity.severity} />;
      },
    },
    {
      header: 'Time',
      key: 'windowStart',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-slate-500">
          {format(new Date(row.windowStart), 'MMM d, HH:mm:ss')}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'dismissed',
      render: (_, row) => (
        <Tag value={row.dismissed ? 'Dismissed' : 'Active'} severity={row.dismissed ? 'secondary' : 'danger'} />
      ),
    },
    {
      header: 'Action',
      key: 'id',
      className: 'w-28',
      render: (_, row) =>
        row.dismissed ? null : (
          <Button
            type="button"
            label="Dismiss"
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
        title="Rate Limit Violations"
        subtitle="IPs that exceeded request thresholds. Dismiss resolved incidents."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Checkbox
          inputId="select-all-violations"
          checked={violations.length > 0 && selected.size === violations.length}
          onChange={toggleAll}
        />
        <label htmlFor="select-all-violations" className="text-sm font-semibold text-slate-600">
          Select all
        </label>
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
        />
        <div className="flex-1" />
        <span className="text-sm text-slate-500">{selected.size} selected</span>
        <Button
          type="button"
          label="Dismiss Selected"
          icon="pi pi-check"
          severity="warning"
          disabled={selected.size === 0}
          loading={bulkDismissMutation.isPending}
          onClick={() => bulkDismissMutation.mutate()}
        />
      </div>

      <DataTable
        columns={columns}
        data={violations}
        isLoading={violationsQuery.isLoading}
        emptyMessage={filter === 'undismissed' ? 'No active violations. Everything looks clean.' : 'No records match this filter.'}
      />
    </div>
  );
}
