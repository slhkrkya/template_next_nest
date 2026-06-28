'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppToast } from '@/providers/prime-provider';
import axiosInstance from '@/lib/axios';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

interface LogFilters {
  level: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

const PAGE_SIZE = 20;
const DEFAULT_FILTERS: LogFilters = { level: '', source: '', dateFrom: '', dateTo: '' };

const levelOptions = [
  { label: 'All levels', value: '' },
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'FATAL', value: 'FATAL' },
];

async function getSystemLogs(params: {
  page: number;
  pageSize: number;
  search?: string;
  level?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: SystemLog[]; totalCount: number }> {
  const res = await axiosInstance.get('/admin/system-logs', { params });
  return res.data;
}

function LevelBadge({ level }: { level: LogLevel }) {
  const severity =
    level === 'ERROR' || level === 'FATAL'
      ? 'danger'
      : level === 'WARN'
        ? 'warning'
        : level === 'INFO'
          ? 'info'
          : 'secondary';

  return <Tag value={level} severity={severity} className="font-mono" />;
}

function toDate(value: string) {
  return value ? new Date(value) : null;
}

function toIsoDate(value: Date | Date[] | null | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : '';
}

function FilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: LogFilters;
  onChange: (filters: LogFilters) => void;
  onReset: () => void;
}) {
  function set<K extends keyof LogFilters>(key: K, value: LogFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-40">
        <label htmlFor="log-level" className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
          Level
        </label>
        <Dropdown
          inputId="log-level"
          value={filters.level}
          options={levelOptions}
          onChange={(event) => set('level', event.value)}
          className="w-full"
        />
      </div>
      <div className="min-w-48">
        <label htmlFor="log-source" className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
          Source
        </label>
        <InputText
          id="log-source"
          value={filters.source}
          onChange={(event) => set('source', event.target.value)}
          placeholder="AuthService"
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="log-from" className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
          From
        </label>
        <Calendar
          inputId="log-from"
          value={toDate(filters.dateFrom)}
          onChange={(event) => set('dateFrom', toIsoDate(event.value))}
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>
      <div>
        <label htmlFor="log-to" className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
          To
        </label>
        <Calendar
          inputId="log-to"
          value={toDate(filters.dateTo)}
          onChange={(event) => set('dateTo', toIsoDate(event.value))}
          dateFormat="yy-mm-dd"
          showIcon
        />
      </div>
      <Button
        type="button"
        label="Reset"
        icon="pi pi-filter-slash"
        severity="secondary"
        outlined
        onClick={onReset}
      />
    </div>
  );
}

function LogDetail({ log, onClose }: { log: SystemLog | null; onClose: () => void }) {
  return (
    <Dialog
      visible={!!log}
      onHide={onClose}
      header={
        log ? (
          <span className="flex items-center gap-2">
            <LevelBadge level={log.level} />
            <span className="font-mono text-sm text-muted-foreground">{log.source}</span>
          </span>
        ) : (
          'Log detail'
        )
      }
      modal
      className="w-[92vw] max-w-3xl"
    >
      {log && (
        <div className="space-y-5">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timestamp</p>
            <p className="m-0 mt-1 font-mono text-sm tabular-nums">
              {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss 'UTC'")}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
            <p className="m-0 mt-1 text-sm leading-6">{log.message}</p>
          </div>
          {log.meta && Object.keys(log.meta).length > 0 && (
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</p>
              <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs leading-6 text-foreground font-mono">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

export default function SystemLogsPage() {
  const { toast } = useAppToast();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSystemLogs({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        level: filters.level || undefined,
        source: filters.source || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setLogs(result.data);
      setTotalCount(result.totalCount);
    } catch {
      toast({ title: 'Failed to load system logs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filters, toast]);

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: Column<SystemLog>[] = [
    { header: 'Level', key: 'level', className: 'w-28', render: (_, row) => <LevelBadge level={row.level} /> },
    { header: 'Message', key: 'message', render: (_, row) => <span className="line-clamp-2 text-sm">{row.message}</span> },
    { header: 'Source', key: 'source', className: 'w-44', render: (_, row) => <span className="font-mono text-xs text-muted-foreground">{row.source}</span> },
    {
      header: 'Time',
      key: 'createdAt',
      className: 'w-44',
      render: (_, row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(row.createdAt), 'dd MMM HH:mm:ss')}
        </span>
      ),
    },
    {
      header: '',
      key: 'id',
      className: 'w-16',
      render: (_, row) => (
        <Button
          type="button"
          icon="pi pi-eye"
          severity="secondary"
          text
          rounded
          aria-label="View log details"
          onClick={() => setSelectedLog(row)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="System Logs"
        subtitle="Monitor application events, errors, and warnings."
      />
      <FilterBar filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search messages..."
        pagination={{ page, pageSize: PAGE_SIZE, totalCount, onPageChange: setPage }}
        emptyMessage="No logs found for the selected filters."
      />
      <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
