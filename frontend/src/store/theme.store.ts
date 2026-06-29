import { create } from 'zustand'
import type { ColorScheme, PrimeInputStyle, UserThemePreference } from '@/types'

interface ThemePreferenceState {
  preference: UserThemePreference
  setPreference: (preference?: Partial<UserThemePreference> | null) => void
  updatePreference: (partial: Partial<UserThemePreference>) => UserThemePreference
  resetPreference: () => void
}

export const DEFAULT_THEME_PREFERENCE: UserThemePreference = {
  colorScheme: 'light',
  inputStyle: 'outlined',
  ripple: true,
  scale: 14,
}

export const SCALE_OPTIONS = [12, 13, 14, 15, 16, 17, 18]

export const INPUT_STYLE_OPTIONS: Array<{ label: string; value: PrimeInputStyle }> = [
  { label: 'Outlined', value: 'outlined' },
  { label: 'Filled', value: 'filled' },
]

export const COLOR_SCHEME_OPTIONS: Array<{ label: string; value: ColorScheme }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export const useThemeStore = create<ThemePreferenceState>((set, get) => ({
  preference: DEFAULT_THEME_PREFERENCE,

  setPreference: (preference) => {
    set({ preference: normalizeThemePreference(preference) })
  },

  updatePreference: (partial) => {
    const next = normalizeThemePreference({ ...get().preference, ...partial })
    set({ preference: next })
    return next
  },

  resetPreference: () => {
    set({ preference: DEFAULT_THEME_PREFERENCE })
  },
}))

export function normalizeThemePreference(
  preference?: Partial<UserThemePreference> | null,
): UserThemePreference {
  const merged = { ...DEFAULT_THEME_PREFERENCE, ...(preference ?? {}) }
  return {
    colorScheme: merged.colorScheme === 'dark' ? 'dark' : 'light',
    inputStyle: merged.inputStyle === 'filled' ? 'filled' : 'outlined',
    ripple: merged.ripple !== false,
    scale: clampScale(merged.scale),
  }
}

function clampScale(scale: number) {
  if (!Number.isFinite(scale)) return DEFAULT_THEME_PREFERENCE.scale
  return Math.min(18, Math.max(12, Math.round(scale)))
}
