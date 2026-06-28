'use client';

import { useCallback, useState } from 'react';
import { Column as PrimeColumn } from 'primereact/column';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Skeleton } from 'primereact/skeleton';
import { classNames } from 'primereact/utils';
import { useTranslations } from 'next-intl';

export interface Column<T = Record<string, unknown>> {
  header: string;
  key: string;
  className?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  pagination,
  onSearch,
  searchPlaceholder,
  className,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations('common');
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      onSearch?.(value);
    },
    [onSearch],
  );

  const loadingRows = Array.from({ length: 6 }).map((_, index) => ({
    id: `loading-${index}`,
  })) as T[];

  const value = isLoading ? loadingRows : data;
  const first = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))
    : 1;
  const start = pagination && pagination.totalCount > 0 ? first + 1 : 0;
  const end = pagination
    ? Math.min(first + pagination.pageSize, pagination.totalCount)
    : data.length;

  return (
    <div className={classNames('flex flex-col gap-3', className)}>
      {onSearch && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <span className="p-input-icon-left w-full max-w-sm">
            <i className="pi pi-search" />
            <InputText
              value={searchValue}
              onChange={handleSearch}
              placeholder={searchPlaceholder ?? t('searchPlaceholder')}
              className="w-full"
              aria-label={t('search')}
            />
          </span>
        </div>
      )}

      <PrimeDataTable
        value={value}
        dataKey="id"
        loading={false}
        emptyMessage={emptyMessage ?? t('noData')}
        rowHover
        showGridlines={false}
        className="arca-data-table"
        tableStyle={{ minWidth: '42rem' }}
      >
        {columns.map((col) => (
          <PrimeColumn
            key={col.key}
            header={col.header}
            className={col.className}
            body={(row: T, options) =>
              isLoading ? (
                <Skeleton height="1rem" />
              ) : col.render ? (
                col.render((row as Record<string, unknown>)[col.key], row, options.rowIndex)
              ) : (
                String((row as Record<string, unknown>)[col.key] ?? '')
              )
            }
          />
        ))}
      </PrimeDataTable>

      {pagination && (
        <div className="flex flex-col gap-2 rounded-b-lg border border-t-0 border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-sm text-muted-foreground">
            {pagination.totalCount === 0
              ? t('noResults')
              : t('showing', { start, end, total: pagination.totalCount })}
          </p>
          <Paginator
            first={first}
            rows={pagination.pageSize}
            totalRecords={pagination.totalCount}
            onPageChange={(event) => pagination.onPageChange(event.page + 1)}
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            className="border-0 p-0"
            pageLinkSize={Math.min(5, totalPages)}
          />
        </div>
      )}
    </div>
  );
}
