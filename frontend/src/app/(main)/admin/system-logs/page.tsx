'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterField, getPrimeOverlayAppendTo } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAppToast } from '@/providers/prime-provider';
import { getAdminSystemLogs } from '@/lib/api/admin.api';
import { translateLogLevel, translateSystemLogMessage } from '@/lib/i18n/log-translations';

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
const logLevels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

function LevelBadge({ level }: { level: LogLevel }) {
  const t = useTranslations('systemLogs');
  const severity =
    level === 'ERROR' || level === 'FATAL'
      ? 'danger'
      : level === 'WARN'
        ? 'warning'
        : level === 'INFO'
          ? 'info'
          : 'secondary';

  return <Tag value={translateLogLevel(level, t)} severity={severity} />;
}

function toDate(value: string) {
  return value ? new Date(value) : null;
}

function toIsoDate(value: Date | Date[] | null | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : '';
}

function SystemLogFilterBar({
  filters,
  levelOptions,
  onChange,
  onReset,
}: {
  filters: LogFilters;
  levelOptions: { label: string; value: string }[];
  onChange: (filters: LogFilters) => void;
  onReset: () => void;
}) {
  const t = useTranslations('systemLogs');
  const commonT = useTranslations('common');

  function set<K extends keyof LogFilters>(key: K, value: LogFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

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
      <FilterField label={t('level')} htmlFor="log-level">
        <Dropdown
          inputId="log-level"
          value={filters.level}
          options={levelOptions}
          onChange={(event) => set('level', event.value ?? '')}
          placeholder={t('allLevels')}
          className="w-full"
          showClear
          appendTo={getPrimeOverlayAppendTo()}
        />
      </FilterField>
      <FilterField label={t('source')} htmlFor="log-source">
        <InputText
          id="log-source"
          value={filters.source}
          onChange={(event) => set('source', event.target.value)}
          placeholder={t('sourcePlaceholder')}
          className="w-full"
        />
      </FilterField>
      <FilterField label={t('from')} htmlFor="log-from">
        <Calendar
          inputId="log-from"
          value={toDate(filters.dateFrom)}
          onChange={(event) => set('dateFrom', toIsoDate(event.value))}
          dateFormat="yy-mm-dd"
          showIcon
          showButtonBar
          appendTo={getPrimeOverlayAppendTo()}
          className="w-full"
        />
      </FilterField>
      <FilterField label={t('to')} htmlFor="log-to">
        <Calendar
          inputId="log-to"
          value={toDate(filters.dateTo)}
          onChange={(event) => set('dateTo', toIsoDate(event.value))}
          dateFormat="yy-mm-dd"
          showIcon
          showButtonBar
          appendTo={getPrimeOverlayAppendTo()}
          className="w-full"
        />
      </FilterField>
    </FilterBar>
  );
}

function LogDetail({ log, onClose }: { log: SystemLog | null; onClose: () => void }) {
  const t = useTranslations('systemLogs');
  const message = log ? translateSystemLogMessage(log.message, t) : '';

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
          t('detail')
        )
      }
      modal
      className="w-[92vw] max-w-3xl"
    >
      {log && (
        <div className="space-y-5">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('timestamp')}</p>
            <p className="m-0 mt-1 font-mono text-sm tabular-nums">
              {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss 'UTC'")}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('message')}</p>
            <p className="m-0 mt-1 text-sm leading-6">{message}</p>
          </div>
          {log.meta && Object.keys(log.meta).length > 0 && (
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('metadata')}</p>
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

export default function AdminSystemLogsPage() {
  const t = useTranslations('systemLogs');
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
      const result = await getAdminSystemLogs({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        level: filters.level || undefined,
        source: filters.source || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setLogs(result.data as unknown as SystemLog[]);
      setTotalCount(result.meta.total);
    } catch {
      toast({ title: t('loadFailed'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filters, toast, t]);

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const levelOptions = [
    { label: t('allLevels'), value: '' },
    ...logLevels.map((level) => ({ label: translateLogLevel(level, t), value: level })),
  ];

  const columns: Column<SystemLog>[] = [
    { header: t('level'), key: 'level', className: 'w-28', render: (_, row) => <LevelBadge level={row.level} /> },
    { header: t('message'), key: 'message', render: (_, row) => <span className="line-clamp-2 text-sm">{translateSystemLogMessage(row.message, t)}</span> },
    { header: t('source'), key: 'source', className: 'w-44', render: (_, row) => <span className="font-mono text-xs text-muted-foreground">{row.source}</span> },
    {
      header: t('time'),
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
          aria-label={t('viewDetails')}
          onClick={() => setSelectedLog(row)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <SystemLogFilterBar
        filters={filters}
        levelOptions={levelOptions}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        onSearch={setSearch}
        searchPlaceholder={t('searchMessages')}
        minWidth="54rem"
        pagination={{ page, pageSize: PAGE_SIZE, totalCount, onPageChange: setPage }}
        emptyMessage={t('empty')}
      />
      <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
