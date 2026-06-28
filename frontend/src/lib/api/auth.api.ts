import axiosInstance from '@/lib/axios'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '@/types'

/**
 * Authenticate with email + password (and optional CAPTCHA).
 * Returns the access token and the resolved user object.
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data)
  return response.data
}

/**
 * Register a new account. The server sends a verification email.
 */
export async function register(
  data: RegisterRequest,
): Promise<{ message: string }> {
  const response = await axiosInstance.post<{ message: string }>(
    '/auth/register',
    data,
  )
  return response.data
}

/**
 * Invalidate the current session. The server clears the httpOnly cookie.
 */
export async function logout(): Promise<void> {
  await axiosInstance.post('/auth/logout')
}

/**
 * Fetch a CSRF token from the server. Also sets the _csrf cookie used by
 * the CSRF guard on state-changing endpoints like /auth/refresh.
 */
export async function getCsrfToken(): Promise<string> {
  const response = await axiosInstance.get<{ csrfToken: string }>(
    '/auth/csrf-token',
  )
  return response.data.csrfToken
}

/**
 * Exchange the httpOnly refresh-token cookie for a new access token.
 * Called automatically by the axios response interceptor on 401.
 */
export async function refreshToken(): Promise<{ accessToken: string }> {
  const csrfToken = await getCsrfToken()
  const response = await axiosInstance.post<{ accessToken: string }>(
    '/auth/refresh',
    {},
    { headers: { 'x-csrf-token': csrfToken } },
  )
  return response.data
}

/**
 * Trigger a password-reset email for the given address.
 */
export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  const response = await axiosInstance.post<{ message: string }>(
    '/auth/forgot-password',
    { email },
  )
  return response.data
}

/**
 * Complete a password reset using the token from the email link.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await axiosInstance.post<{ message: string }>(
    '/auth/reset-password',
    { token, newPassword },
  )
  return response.data
}

/**
 * Verify a newly registered account using the token from the email link.
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await axiosInstance.post<{ message: string }>(
    '/auth/verify-email',
    { token },
  )
  return response.data
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getMe(): Promise<AuthUser> {
  const response = await axiosInstance.get<AuthUser>('/auth/me')
  return response.data
}

/**
 * Switch SuperAdmin tenant context. Pass null to return to global mode.
 * Issues new access + refresh tokens and sets cookies server-side.
 */
export async function switchTenant(
  tenantId: string | null,
): Promise<{ accessToken: string; tenantId: string | null; tenantName: string | null }> {
  const csrfToken = await getCsrfToken()
  const response = await axiosInstance.post(
    '/auth/switch-tenant',
    { tenantId },
    { headers: { 'x-csrf-token': csrfToken } },
  )
  return response.data
}
