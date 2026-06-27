'use client'

import { useRouter } from 'next/navigation'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '@/lib/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types'

/**
 * useAuth wraps the auth store with the API calls and navigation that
 * components shouldn't have to orchestrate themselves.
 */
export function useAuth() {
  const router = useRouter()
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    clearAuth,
    updateUser,
    setLoading,
  } = useAuthStore()

  // ---------------------------------------------------------------------------

  async function login(data: LoginRequest): Promise<LoginResponse> {
    setLoading(true)
    try {
      const response = await apiLogin(data)
      setAuth(response.user, response.accessToken)
      return response
    } catch (error) {
      setLoading(false)
      throw error // re-throw so the form can display the error
    }
  }

  // ---------------------------------------------------------------------------

  async function register(data: RegisterRequest): Promise<{ message: string }> {
    return apiRegister(data)
  }

  // ---------------------------------------------------------------------------

  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } catch {
      // Swallow network errors; we clear local state regardless.
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  // ---------------------------------------------------------------------------

  function isAdmin(): boolean {
    return user?.isSuperAdmin ?? false
  }

  function isSuperAdmin(): boolean {
    return user?.isSuperAdmin ?? false
  }

  // ---------------------------------------------------------------------------

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : ''

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : ''

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    fullName,
    initials,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isSuperAdmin,
  }
}
