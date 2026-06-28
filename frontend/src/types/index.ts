export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export type NotifType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

export type ColorScheme = 'light' | 'dark'

export type PrimeInputStyle = 'outlined' | 'filled'

export type SortOrder = 'asc' | 'desc'

export type ScopeType = 'SELF' | 'DEPARTMENT' | 'ALL'

export interface LoginRequest {
  email: string
  password: string
  captchaToken?: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface UserSettings {
  language: string
  themePreset: string
  colorScheme: ColorScheme
  timezoneOffset: number
}

export interface UserThemePreference {
  themeFamily: string
  themeName: string
  colorScheme: ColorScheme
  inputStyle: PrimeInputStyle
  ripple: boolean
  scale: number
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isSuperAdmin: boolean
  tenantId?: string
  tenantName?: string
  profilePictureUrl?: string
  settings: UserSettings
  themePreference?: UserThemePreference
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  companyName?: string
  captchaToken?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isSuperAdmin: boolean
  isActive: boolean
  isEmailVerified: boolean
  tenantId?: string
  tenantName?: string
  profilePictureUrl?: string
  settings: UserSettings
  themePreference?: UserThemePreference
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface OperationClaim {
  id: string
  name: string
  description: string
  priority: number
  isActive: boolean
}

export interface PermissionEntity {
  id: string
  name: string
  displayName: string
  description: string
  displayOrder: number
}

export interface UserEntityPermission {
  id: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface RoleEntityPermission {
  id: string
  role: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface UpsertUserPermissionRequest {
  userId: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface UpsertRolePermissionRequest {
  roleId: string
  entityName: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  trialEndsAt?: string
  maxUsers: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateTenantRequest {
  name: string
  slug: string
  maxUsers?: number
  trialEndsAt?: string
}

export interface UpdateTenantRequest {
  name?: string
  maxUsers?: number
  trialEndsAt?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  maxUsers: number
  monthlyPrice: number
  yearlyPrice: number
  isActive: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotifType
  isRead: boolean
  readAt: string | null
  createdAt: string
  link?: string
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type: NotifType
  userId?: string
  link?: string
}

export interface AuditLog {
  id: string
  userId: string
  entityName: string
  entityId: string
  action: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface BannedIp {
  id: string
  ipAddress: string
  reason: string
  createdAt: string
  expiresAt?: string
}

export interface RateLimitViolation {
  id: string
  ipAddress: string
  endpoint: string
  requestCount: number
  isDismissed: boolean
  createdAt: string
}

export interface EmailParameters {
  id: string
  tenantId: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

export interface UserDataScope {
  id: string
  userId: string
  entityName: string
  scopeType: ScopeType
}

export interface EntityWorkflow {
  id: string
  tenantId: string
  entityName: string
  name: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: any
  isActive: boolean
}

export interface TableColumnPreference {
  key: string
  visible: boolean
  order: number
  width?: number
}

export interface TablePreferences {
  tableName: string
  columns: TableColumnPreference[]
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface PagedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export interface DailyLoginStat {
  date: string
  count: number
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalTenants: number
  newUsersToday: number
  dailyLoginStats: DailyLoginStat[]
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  profilePictureUrl?: string
  settings?: {
    language?: string
    theme?: string
    timezone?: string
  }
}

export interface UpdateSettingsRequest {
  language?: string
  themePreset?: string
  colorScheme?: ColorScheme
  timezoneOffset?: number
}

export type UpdateThemePreferenceRequest = Partial<UserThemePreference>

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}
