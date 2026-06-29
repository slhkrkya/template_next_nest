'use client';

import { useState } from 'react';
import axiosInstance from '@/lib/axios';
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
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { translateAuditAction, translateAuditEntity, translateAuditField } from '@/lib/i18n/log-translations';

interface AuditLogUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  user?: AuditLogUser;
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
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const pageSize = 15;
const auditActions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const;

async function getAuditLogs(params: {
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  entityName?: string;
  action?: string;
  userId?: string;
}): Promise<AuditLogsResponse> {
  const res = await axiosInstance.get<AuditLogsResponse>('/admin/audit-logs', {
    params: {
      page: params.page,
      limit: params.pageSize,
      ...(params.dateFrom && { dateFrom: params.dateFrom }),
      ...(params.dateTo && { dateTo: params.dateTo }),
      ...(params.entityName && { entityName: params.entityName }),
      ...(params.action && { action: params.action }),
      ...(params.userId && { userId: params.userId }),
    },
  });
  return {
    ...res.data,
    data: res.data.data.map((log) => ({
      ...log,
      userName: log.userName ?? ([log.user?.firstName, log.user?.lastName].filter(Boolean).join(' ') || log.user?.email || log.userId),
    })),
  };
}

async function getEntities(): Promise<string[]> {
  try {
    const res = await axiosInstance.get<{ name: string }[]>('/permissions/entities');
    return res.data.map((e) => e.name);
  } catch {
    return [];
  }
}

function actionSeverity(action: string) {
  if (action === 'DELETE') return 'danger' as const;
  if (action === 'CREATE') return 'success' as const;
  if (action === 'UPDATE') return 'info' as const;
  if (action === 'LOGIN') return 'warning' as const;
  return 'secondary' as const;
}

function ActionBadge({ action }: { action: string }) {
  const t = useTranslations('auditLogs');
  return <Tag value={translateAuditAction(action, t)} severity={actionSeverity(action)} />;
}

function JsonDiff({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}) {
  const t = useTranslations('auditLogs');
  const allKeys = Array.from(new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]));

  if (allKeys.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">{t('noValueChanges')}</p>;
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
        header={t('field')}
        body={(row) => <span className="text-sm font-semibold text-primary">{translateAuditField(row.key, t)}</span>}
      />
      <PrimeColumn
        field="before"
        header={t('before')}
        body={(row) => <span className="break-all text-sm text-rose-600">{row.before}</span>}
      />
      <PrimeColumn
        field="after"
        header={t('after')}
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
  const t = useTranslations('auditLogs');
  const commonT = useTranslations('common');
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
  const total = logsQuery.data?.meta.total ?? 0;
  const actionOptions = [
    { label: t('allActions'), value: '' },
    ...auditActions.map((action) => ({
      label: translateAuditAction(action, t),
      value: action,
    })),
  ];
  const entityOptions = [
    { label: t('allEntities'), value: '' },
    ...(entitiesQuery.data ?? []).map((entity) => ({ label: translateAuditEntity(entity, t), value: entity })),
  ];

  const columns: Column<AuditLog>[] = [
    {
      header: t('user'),
      key: 'userName',
      render: (_, log) => (
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">{log.userName}</p>
          <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">{log.userId}</p>
        </div>
      ),
    },
    { header: t('entity'), key: 'entityName', render: (_, log) => <span className="text-sm font-semibold text-muted-foreground">{translateAuditEntity(log.entityName, t)}</span> },
    { header: t('action'), key: 'action', render: (_, log) => <ActionBadge action={log.action} /> },
    { header: t('entityId'), key: 'entityId', render: (_, log) => <span className="font-mono text-xs text-muted-foreground">{log.entityId}</span> },
    { header: t('ipAddress'), key: 'ipAddress', render: (_, log) => <span className="font-mono text-xs text-muted-foreground">{log.ipAddress}</span> },
    {
      header: t('time'),
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
          aria-label={t('viewDetails')}
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
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            type="button"
            label={t('exportCsv')}
            icon="pi pi-download"
            severity="secondary"
            outlined
            disabled={logs.length === 0}
            onClick={() => downloadCSV(logs)}
          />
        }
      />

      <FilterBar
        actions={
          <Button type="button" label={commonT('clear')} icon="pi pi-filter-slash" severity="secondary" outlined onClick={resetFilters} />
        }
      >
        <FilterField label={t('from')} htmlFor="audit-from">
          <Calendar
            inputId="audit-from"
            value={toDate(dateFrom)}
            onChange={(event) => {
              setDateFrom(toIsoDate(event.value));
              setPage(1);
            }}
            placeholder={t('from')}
            dateFormat="yy-mm-dd"
            showIcon
            showButtonBar
            appendTo={getPrimeOverlayAppendTo()}
            className="w-full"
          />
        </FilterField>
        <FilterField label={t('to')} htmlFor="audit-to">
          <Calendar
            inputId="audit-to"
            value={toDate(dateTo)}
            onChange={(event) => {
              setDateTo(toIsoDate(event.value));
              setPage(1);
            }}
            placeholder={t('to')}
            dateFormat="yy-mm-dd"
            showIcon
            showButtonBar
            appendTo={getPrimeOverlayAppendTo()}
            className="w-full"
          />
        </FilterField>
        <FilterField label={t('entity')} htmlFor="audit-entity">
          <Dropdown
            inputId="audit-entity"
            value={entityFilter}
            options={entityOptions}
            onChange={(event) => {
              setEntityFilter(event.value ?? '');
              setPage(1);
            }}
            placeholder={t('allEntities')}
            className="w-full"
            loading={entitiesQuery.isLoading}
            filter
            showClear
            appendTo={getPrimeOverlayAppendTo()}
          />
        </FilterField>
        <FilterField label={t('action')} htmlFor="audit-action">
          <Dropdown
            inputId="audit-action"
            value={actionFilter}
            options={actionOptions}
            onChange={(event) => {
              setActionFilter(event.value ?? '');
              setPage(1);
            }}
            placeholder={t('allActions')}
            className="w-full"
            showClear
            appendTo={getPrimeOverlayAppendTo()}
          />
        </FilterField>
        <FilterField label={t('userId')} htmlFor="audit-user">
          <InputText
            id="audit-user"
            value={userIdFilter}
            onChange={(event) => {
              setUserIdFilter(event.target.value);
              setPage(1);
            }}
            placeholder={t('userId')}
            className="w-full"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={logsQuery.isLoading}
        minWidth="56rem"
        pagination={{ page, pageSize, totalCount: total, onPageChange: setPage }}
        emptyMessage={t('empty')}
      />

      <Dialog
        visible={!!detailLog}
        onHide={() => setDetailLog(null)}
        header={t('detail')}
        modal
        className="w-[92vw] max-w-4xl"
      >
        {detailLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                [t('user'), detailLog.userName],
                [t('entity'), translateAuditEntity(detailLog.entityName, t)],
                [t('entityId'), detailLog.entityId],
                [t('ipAddress'), detailLog.ipAddress],
                [t('time'), format(new Date(detailLog.createdAt), 'PPpp')],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted p-3">
                  <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                  <p className="m-0 mt-1 break-all text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
              <div className="rounded-lg bg-muted p-3">
                <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">{t('action')}</p>
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
