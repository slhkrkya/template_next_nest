'use client'

import { useCallback, useState } from 'react'
import type { PaginationQuery, SortOrder } from '@/types'

interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string
  initialSortBy?: string
  initialSortOrder?: SortOrder
}

interface PaginationState {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: SortOrder
}

interface PaginationActions {
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: SortOrder) => void
  toggleSortOrder: () => void
  /**
   * Change the sort column. If the same column is clicked again, flip the
   * sort direction; otherwise reset to ascending.
   */
  handleSort: (column: string) => void
  /** Reset to the initial state. */
  reset: () => void
  /** The current state shaped as a PaginationQuery for passing to API calls. */
  query: PaginationQuery
}

/**
 * usePagination manages the full set of table-control state — page, page size,
 * search text, and column sort — in one place.
 *
 * Example:
 *   const pagination = usePagination({ initialPageSize: 20 })
 *   const { data } = useQuery(['users', pagination.query], () =>
 *     getUsers(pagination.query))
 */
export function usePagination(
  options: PaginationOptions = {},
): PaginationState & PaginationActions {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialSortBy = '',
    initialSortOrder = 'asc',
  } = options

  const [page, setPageRaw] = useState(initialPage)
  const [pageSize, setPageSizeRaw] = useState(initialPageSize)
  const [search, setSearchRaw] = useState(initialSearch)
  const [sortBy, setSortByRaw] = useState(initialSortBy)
  const [sortOrder, setSortOrderRaw] = useState<SortOrder>(initialSortOrder)

  // Always reset to page 1 when the search term changes
  const setSearch = useCallback((value: string) => {
    setSearchRaw(value)
    setPageRaw(1)
  }, [])

  // Reset to page 1 when page size changes
  const setPageSize = useCallback((value: number) => {
    setPageSizeRaw(value)
    setPageRaw(1)
  }, [])

  const setPage = useCallback((value: number) => {
    setPageRaw(value)
  }, [])

  const setSortBy = useCallback((value: string) => {
    setSortByRaw(value)
  }, [])

  const setSortOrder = useCallback((value: SortOrder) => {
    setSortOrderRaw(value)
  }, [])

  const toggleSortOrder = useCallback(() => {
    setSortOrderRaw((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  const handleSort = useCallback(
    (column: string) => {
      if (column === sortBy) {
        setSortOrderRaw((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortByRaw(column)
        setSortOrderRaw('asc')
      }
      setPageRaw(1)
    },
    [sortBy],
  )

  const reset = useCallback(() => {
    setPageRaw(initialPage)
    setPageSizeRaw(initialPageSize)
    setSearchRaw(initialSearch)
    setSortByRaw(initialSortBy)
    setSortOrderRaw(initialSortOrder)
  }, [initialPage, initialPageSize, initialSearch, initialSortBy, initialSortOrder])

  const query: PaginationQuery = {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(sortBy ? { sortBy, sortOrder } : {}),
  }

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    setPage,
    setPageSize,
    setSearch,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    handleSort,
    reset,
    query,
  }
}
