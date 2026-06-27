import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Tailwind class merger ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Format a date string or Date object to a locale-aware display string.
 *
 * @example formatDate('2024-03-15') // "Mar 15, 2024"
 * @example formatDate(new Date(), 'en-GB', { dateStyle: 'full' })
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Format a date as a relative human-readable string.
 *
 * @example formatRelativeTime('2024-03-14T10:00:00Z') // "2 days ago"
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale = 'en-US',
): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1_000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffSeconds) < 60) return rtf.format(-diffSeconds, 'second')
  if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour')
  if (Math.abs(diffDays) < 7) return rtf.format(-diffDays, 'day')
  if (Math.abs(diffWeeks) < 5) return rtf.format(-diffWeeks, 'week')
  if (Math.abs(diffMonths) < 12) return rtf.format(-diffMonths, 'month')
  return rtf.format(-diffYears, 'year')
}

// ─── File size ────────────────────────────────────────────────────────────────

/**
 * Format a byte count as a human-readable string with the appropriate unit.
 *
 * @example formatBytes(1536) // "1.5 KB"
 * @example formatBytes(0)    // "0 B"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '—'

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  return `${value.toFixed(decimals)} ${units[i]}`
}

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Truncate a string to `maxLength` characters, appending an ellipsis if
 * truncation occurs.
 *
 * @example truncate('Hello, world!', 7) // "Hello, …"
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

/**
 * Derive initials from a full name or first/last name pair.
 *
 * @example getInitials('Jane Doe')        // "JD"
 * @example getInitials('Jane', 'Doe')     // "JD"
 * @example getInitials('Madonna')         // "MA"
 */
export function getInitials(
  firstOrFull: string,
  last?: string,
): string {
  if (last !== undefined) {
    const a = firstOrFull.trim()[0] ?? ''
    const b = last.trim()[0] ?? ''
    return (a + b).toUpperCase()
  }

  const parts = firstOrFull.trim().split(/\s+/)
  if (parts.length === 1) {
    // Single name: return first two characters
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Number helpers ───────────────────────────────────────────────────────────

/**
 * Format a number with locale-aware grouping separators.
 *
 * @example formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(
  value: number,
  locale = 'en-US',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Format a decimal as a percentage string.
 *
 * @example formatPercent(0.1234) // "12.3%"
 */
export function formatPercent(
  value: number,
  decimals = 1,
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
