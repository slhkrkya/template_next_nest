import { create } from 'zustand'
import type { ColorScheme, PrimeInputStyle, UserThemePreference } from '@/types'

export interface ThemeOption {
  family: string
  label: string
  name: string
  color: string
  lightTheme: string
  darkTheme: string
}

interface ThemePreferenceState {
  preference: UserThemePreference
  setPreference: (preference?: Partial<UserThemePreference> | null) => void
  updatePreference: (partial: Partial<UserThemePreference>) => UserThemePreference
  resetPreference: () => void
}

export const DEFAULT_THEME_PREFERENCE: UserThemePreference = {
  themeFamily: 'lara',
  themeName: 'indigo',
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

export const THEME_OPTIONS: ThemeOption[] = [
  ...['amber', 'blue', 'cyan', 'green', 'indigo', 'pink', 'purple', 'teal'].map((name) => ({
    family: 'lara',
    label: 'Lara',
    name,
    color: themeColor(name),
    lightTheme: `lara-light-${name}`,
    darkTheme: `lara-dark-${name}`,
  })),
  ...['blue', 'purple'].map((name) => ({
    family: 'bootstrap',
    label: 'Bootstrap',
    name,
    color: themeColor(name),
    lightTheme: `bootstrap4-light-${name}`,
    darkTheme: `bootstrap4-dark-${name}`,
  })),
  ...['indigo', 'deeppurple'].map((name) => ({
    family: 'material',
    label: 'Material Design',
    name,
    color: themeColor(name),
    lightTheme: `md-light-${name}`,
    darkTheme: `md-dark-${name}`,
  })),
  ...['indigo', 'deeppurple'].map((name) => ({
    family: 'material-compact',
    label: 'Material Compact',
    name,
    color: themeColor(name),
    lightTheme: `mdc-light-${name}`,
    darkTheme: `mdc-dark-${name}`,
  })),
  {
    family: 'soho',
    label: 'Soho',
    name: 'default',
    color: '#64748b',
    lightTheme: 'soho-light',
    darkTheme: 'soho-dark',
  },
  {
    family: 'viva',
    label: 'Viva',
    name: 'default',
    color: '#6366f1',
    lightTheme: 'viva-light',
    darkTheme: 'viva-dark',
  },
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
  const option = findThemeOption(merged.themeFamily, merged.themeName)
    ?? findThemeOption(DEFAULT_THEME_PREFERENCE.themeFamily, DEFAULT_THEME_PREFERENCE.themeName)
    ?? THEME_OPTIONS[0]

  return {
    themeFamily: option.family,
    themeName: option.name,
    colorScheme: merged.colorScheme === 'dark' ? 'dark' : 'light',
    inputStyle: merged.inputStyle === 'filled' ? 'filled' : 'outlined',
    ripple: merged.ripple !== false,
    scale: clampScale(merged.scale),
  }
}

export function findThemeOption(family: string, name: string) {
  return THEME_OPTIONS.find(
    (option) => option.family === family && option.name === name,
  )
}

export function getThemeAssetName(preference: UserThemePreference) {
  const option = findThemeOption(preference.themeFamily, preference.themeName)
    ?? THEME_OPTIONS[0]
  return preference.colorScheme === 'dark' ? option.darkTheme : option.lightTheme
}

export function groupThemeOptions() {
  return THEME_OPTIONS.reduce<Record<string, ThemeOption[]>>((groups, option) => {
    groups[option.label] = [...(groups[option.label] ?? []), option]
    return groups
  }, {})
}

function clampScale(scale: number) {
  if (!Number.isFinite(scale)) return DEFAULT_THEME_PREFERENCE.scale
  return Math.min(18, Math.max(12, Math.round(scale)))
}

function themeColor(name: string) {
  const colors: Record<string, string> = {
    amber: '#f59e0b',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    deeppurple: '#7e57c2',
    green: '#22c55e',
    indigo: '#6366f1',
    pink: '#ec4899',
    purple: '#8b5cf6',
    teal: '#14b8a6',
  }

  return colors[name] ?? '#6366f1'
}
