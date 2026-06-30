import { UserEntity, UserProps } from './user.entity'

export interface FindUsersOptions {
  page?: number
  pageSize?: number
  search?: string
  tenantId?: string
  isActive?: boolean
}

export interface PaginatedUsers {
  data: UserEntity[]
  total: number
  page: number
  pageSize: number
}

export interface UserSettingsData {
  language?: string
  themePreset?: string
  colorScheme?: string
  timezoneOffset?: number
}

export interface UserThemePreferenceData {
  themeFamily: string
  themeName: string
  colorScheme: string
  inputStyle: string
  ripple: boolean
  scale: number
}

export type UserThemePreferenceUpdate = Partial<UserThemePreferenceData>

export interface TablePreferenceData {
  tableName: string
  visibleColumns: string[]
}

export const USER_REPOSITORY = Symbol('IUserRepository')

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  findMany(options: FindUsersOptions): Promise<PaginatedUsers>
  create(data: Omit<UserProps, 'createdAt' | 'updatedAt'>): Promise<UserEntity>
  update(id: string, data: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'isActive' | 'passwordHash' | 'role'>>): Promise<UserEntity>
  delete(id: string): Promise<void>
  existsByEmail(email: string): Promise<boolean>
  updateSettings(userId: string, data: UserSettingsData): Promise<UserSettingsData>
  getThemePreference(userId: string): Promise<UserThemePreferenceData>
  updateThemePreference(userId: string, data: UserThemePreferenceUpdate): Promise<UserThemePreferenceData>
  getTablePreferences(userId: string, tableName: string): Promise<TablePreferenceData | null>
  saveTablePreferences(userId: string, tableName: string, visibleColumns: string[]): Promise<TablePreferenceData>
}
