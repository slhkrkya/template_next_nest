'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column as PrimeColumn } from 'primereact/column';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  entityName: string;
  action: string;
  entityId: string;
  ipAddress: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
}

const pageSize = 15;
const actionOptions = [
  { label: 'All Actions', value: '' },
  ...['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((action) => ({
    label: action,
    value: action,
  })),
];

async function getAuditLogs(params: {
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  entityName?: string;
  action?: string;
  userId?: string;
}): Promise<AuditLogsResponse> {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);
  if (params.entityName) qs.set('entityName', params.entityName);
  if (params.action) qs.set('action', params.action);
  if (params.userId) qs.set('userId', params.userId);
  const res = await fetch(`/api/admin/audit-logs?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

async function getEntities(): Promise<string[]> {
  const res = await fetch('/api/admin/entities');
  if (!res.ok) return [];
  const data: { name: string }[] = await res.json();
  return data.map((entity) => entity.name);
}

function actionSeverity(action: string) {
  if (action === 'DELETE') return 'danger' as const;
  if (action === 'CREATE') return 'success' as const;
  if (action === 'UPDATE') return 'info' as const;
  if (action === 'LOGIN') return 'warning' as const;
  return 'secondary' as const;
}

function ActionBadge({ action }: { action: string }) {
  return <Tag value={action} severity={actionSeverity(action)} />;
}

function JsonDiff({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}) {
  const allKeys = Array.from(new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]));

  if (allKeys.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">No value changes recorded.</p>;
  }

  const rows = allKeys.map((key) => ({
    key,
    before: oldValues?.[key] !== undefined ? JSON.stringify(oldValues[key]) : '-',
    after: newValues?.[key] !== undefined ? JSON.stringify(newValues[key]) : '-',
  }));

  return (
    <PrimeDataTable
      value={rows}
      dataKey="key"
      rowHover
      className="arca-data-table"
      tableStyle={{ minWidth: '36rem' }}
    >
      <PrimeColumn
        field="key"
        header="Field"
        body={(row) => <span className="font-mono text-sm text-primary">{row.key}</span>}
      />
      <PrimeColumn
        field="before"
        header="Before"
        body={(row) => <span className="break-all text-sm text-rose-600">{row.before}</span>}
      />
      <PrimeColumn
        field="after"
        header="After"
        body={(row) => <span className="break-all text-sm text-emerald-600">{row.after}</span>}
      />
    </PrimeDataTable>
  );
}

function toIsoDate(value: Date | Date[] | null | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : '';
}

function toDate(value: string) {
  return value ? new Date(value) : null;
}

function downloadCSV(logs: AuditLog[]) {
  const headers = ['ID', 'User', 'Entity', 'Action', 'Entity ID', 'IP Address', 'Time'];
  const rows = logs.map((log) => [
    log.id,
    log.userName,
    log.entityName,
    log.action,
    log.entityId,
    log.ipAddress,
    format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const logsQuery = useQuery({
    queryKey: ['audit-logs', { page, dateFrom, dateTo, entityFilter, actionFilter, userIdFilter }],
    queryFn: () => getAuditLogs({ page, pageSize, dateFrom, dateTo, entityName: entityFilter, action: actionFilter, userId: userIdFilter }),
    placeholderData: (prev) => prev,
  });

  const entitiesQuery = useQuery({ queryKey: ['entity-names'], queryFn: getEntities });
  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.total ?? 0;
  const entityOptions = [
    { label: 'All Entities', value: '' },
    ...(entitiesQuery.data ?? []).map((entity) => ({ label: entity, value: entity })),
  ];

  const columns: Column<AuditLog>[] = [
    {
      header: 'User',
      key: 'userName',
      render: (_, log) => (
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">{log.userName}</p>
          <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">{log.userId}</p>
        </div>
      ),
    },
    { header: 'Entity', key: 'entityName', render: (_, log) => <span className="font-mono text-sm text-muted-foreground">{log.entityName}</span> },
    { header: 'Action', key: 'action', render: (_, log) => <ActionBadge action={log.action} /> },
    { header: 'Entity ID', key: 'entityId', render: (_, log) => <span className="font-mono text-xs text-muted-foreground">{log.entityId}</span> },
    { header: 'IP Address', key: 'ipAddress', render: (_, log) => <span className="font-mono text-xs text-muted-foreground">{log.ipAddress}</span> },
    {
      header: 'Time',
      key: 'createdAt',
      render: (_, log) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
        </span>
      ),
    },
    {
      header: '',
      key: 'id',
      className: 'w-16',
      render: (_, log) => (
        <Button
          type="button"
          icon="pi pi-eye"
          severity="secondary"
          text
          rounded
          aria-label="View details"
          onClick={() => setDetailLog(log)}
        />
      ),
    },
  ];

  function resetFilters() {
    setDateFrom('');
    setDateTo('');
    setEntityFilter('');
    setActionFilter('');
    setUserIdFilter('');
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Complete record of all system actions, including who did what and when."
        actions={
          <Button
            type="button"
            label="Export CSV"
            icon="pi pi-download"
            severity="secondary"
            outlined
            disabled={logs.length === 0}
            onClick={() => downloadCSV(logs)}
          />
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Calendar value={toDate(dateFrom)} onChange={(event) => { setDateFrom(toIsoDate(event.value)); setPage(1); }} placeholder="From" dateFormat="yy-mm-dd" showIcon />
        <Calendar value={toDate(dateTo)} onChange={(event) => { setDateTo(toIsoDate(event.value)); setPage(1); }} placeholder="To" dateFormat="yy-mm-dd" showIcon />
        <Dropdown value={entityFilter} options={entityOptions} onChange={(event) => { setEntityFilter(event.value); setPage(1); }} className="w-48" loading={entitiesQuery.isLoading} />
        <Dropdown value={actionFilter} options={actionOptions} onChange={(event) => { setActionFilter(event.value); setPage(1); }} className="w-44" />
        <InputText value={userIdFilter} onChange={(event) => { setUserIdFilter(event.target.value); setPage(1); }} placeholder="User ID" className="w-48" />
        <Button type="button" label="Clear" icon="pi pi-filter-slash" severity="secondary" outlined onClick={resetFilters} />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={logsQuery.isLoading}
        pagination={{ page, pageSize, totalCount: total, onPageChange: setPage }}
        emptyMessage="No audit logs found."
      />

      <Dialog
        visible={!!detailLog}
        onHide={() => setDetailLog(null)}
        header="Audit Log Detail"
        modal
        className="w-[92vw] max-w-4xl"
      >
        {detailLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ['User', detailLog.userName],
                ['Entity', detailLog.entityName],
                ['Entity ID', detailLog.entityId],
                ['IP Address', detailLog.ipAddress],
                ['Time', format(new Date(detailLog.createdAt), 'PPpp')],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted p-3">
                  <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                  <p className="m-0 mt-1 break-all text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
              <div className="rounded-lg bg-muted p-3">
                <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">Action</p>
                <div className="mt-1"><ActionBadge action={detailLog.action} /></div>
              </div>
            </div>
            <JsonDiff oldValues={detailLog.oldValues} newValues={detailLog.newValues} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
