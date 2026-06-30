const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/**
 * Converts a duration string like '15m', '2h', '7d', '900s' to milliseconds.
 * Falls back to `fallbackMs` (default 15 minutes) when the format is unrecognised.
 */
export function parseDurationMs(duration: string, fallbackMs = 900_000): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) return fallbackMs
  return parseInt(match[1], 10) * (UNIT_MS[match[2]] ?? fallbackMs)
}
