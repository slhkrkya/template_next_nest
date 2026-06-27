import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ColorScheme } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeState {
  theme: ColorScheme
  preset: string
}

interface ThemeActions {
  setTheme: (theme: ColorScheme) => void
  toggleTheme: () => void
  setPreset: (preset: string) => void
}

type ThemeStore = ThemeState & ThemeActions

// ─── Store ────────────────────────────────────────────────────────────────────
// Theme preference is the one piece of state that should survive a page reload
// without an API round-trip, so we persist it to localStorage.

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      theme: 'light',
      preset: 'default',

      // ── Actions ──────────────────────────────────────────────────────────
      setTheme: (theme) => {
        set({ theme })
        applyThemeToDom(theme)
      },

      toggleTheme: () => {
        const next: ColorScheme =
          get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        applyThemeToDom(next)
      },

      setPreset: (preset) => set({ preset }),
    }),
    {
      name: 'theme-storage',
      // Re-apply the persisted theme to the DOM on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDom(state.theme)
        }
      },
    },
  ),
)

// ─── DOM helper ───────────────────────────────────────────────────────────────
// Toggles the `dark` class on <html> so Tailwind's `dark:` variants work.

function applyThemeToDom(theme: ColorScheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
