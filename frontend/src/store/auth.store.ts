import { create } from 'zustand'
import { setAxiosAccessToken } from '@/lib/axios'
import type { AuthUser } from '@/types'

// - Types -

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  /**
   * Persist a successful login: stores user + token in memory and syncs the
   * token with the axios interceptor module.
   */
  setAuth: (user: AuthUser, token: string) => void
  /**
   * Clear all auth state (logout / session expiry).
   */
  clearAuth: () => void
  /**
   * Partially update the stored user without touching the token.
   */
  updateUser: (partial: Partial<AuthUser>) => void
  /**
   * Toggle the global loading flag used during auth operations.
   */
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

// - Store -

export const useAuthStore = create<AuthStore>((set, get) => ({
  // - Initial state -
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  // - Actions -
  setAuth: (user, token) => {
    setAxiosAccessToken(token) // keep axios mirror in sync
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    setAxiosAccessToken(null)
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  updateUser: (partial) => {
    const current = get().user
    if (!current) return
    set({ user: { ...current, ...partial } })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))

// - Standalone helper -
// Exported so non-React code (e.g. axios interceptor) can read the token
// without subscribing to the store.

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}
