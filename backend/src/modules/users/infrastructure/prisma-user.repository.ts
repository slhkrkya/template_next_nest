import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import {
  IUserRepository,
  FindUsersOptions,
  PaginatedUsers,
  UserSettingsData,
  UserThemePreferenceData,
  UserThemePreferenceUpdate,
  TablePreferenceData,
} from '../domain/user.repository.interface'
import { UserEntity, UserProps } from '../domain/user.entity'

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly defaultThemePreference: UserThemePreferenceData = {
    themeFamily: 'lara',
    themeName: 'indigo',
    colorScheme: 'light',
    inputStyle: 'outlined',
    ripple: true,
    scale: 14,
  }

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  private toEntity(raw: any): UserEntity {
    return new UserEntity({
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      passwordHash: raw.passwordHash,
      isActive: raw.isActive,
      isSuperAdmin: raw.isSuperAdmin ?? false,
      tenantId: raw.tenantId ?? null,
      role: raw.operationClaims?.[0]?.operationClaim?.name,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  private readonly select = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    passwordHash: true,
    isActive: true,
    isSuperAdmin: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    operationClaims: {
      select: {
        operationClaim: { select: { id: true, name: true } },
      },
    },
  } as const

  async findById(id: string): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({ where: { id }, select: this.select })
    return raw ? this.toEntity(raw) : null
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const raw = await this.prisma.user.findUnique({ where: { email }, select: this.select })
    return raw ? this.toEntity(raw) : null
  }

  async findMany(options: FindUsersOptions): Promise<PaginatedUsers> {
    const { page = 1, pageSize = 20, search, tenantId, isActive } = options
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: pageSize, select: this.select, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ])

    return { data: data.map(r => this.toEntity(r)), total, page, pageSize }
  }

  async create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const raw = await this.prisma.user.create({
      data: {
        id: props.id,
        email: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
        passwordHash: props.passwordHash,
        isActive: props.isActive,
        isSuperAdmin: props.isSuperAdmin,
        tenantId: props.tenantId,
        settings: {
          create: { language: 'en', themePreset: 'default', colorScheme: 'light', timezoneOffset: 0 },
        },
        themePreference: {
          create: this.defaultThemePreference,
        },
        ...(props.role ? {
          operationClaims: {
            create: {
              operationClaim: { connect: { name: props.role } },
            },
          },
        } : {}),
      },
      select: this.select,
    })
    return this.toEntity(raw)
  }

  async update(id: string, data: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'isActive' | 'passwordHash'>>): Promise<UserEntity> {
    const raw = await this.prisma.user.update({ where: { id }, data, select: this.select })
    return this.toEntity(raw)
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).userThemePreference.deleteMany({ where: { userId: id } })
    await this.prisma.user.delete({ where: { id } })
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } })
    return count > 0
  }

  async updateSettings(userId: string, data: UserSettingsData): Promise<UserSettingsData> {
    const result = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.themePreset !== undefined ? { themePreset: data.themePreset } : {}),
        ...(data.colorScheme !== undefined ? { colorScheme: data.colorScheme } : {}),
        ...(data.timezoneOffset !== undefined ? { timezoneOffset: data.timezoneOffset } : {}),
      },
      create: {
        userId,
        language: data.language ?? 'en',
        themePreset: data.themePreset ?? 'default',
        colorScheme: data.colorScheme ?? 'light',
        timezoneOffset: data.timezoneOffset ?? 0,
      },
    })
    return {
      language: result.language,
      themePreset: result.themePreset,
      colorScheme: result.colorScheme,
      timezoneOffset: result.timezoneOffset,
    }
  }

  async getThemePreference(userId: string): Promise<UserThemePreferenceData> {
    const result = await (this.prisma as any).userThemePreference.findUnique({
      where: { userId },
    })

    return result ? this.mapThemePreference(result) : this.defaultThemePreference
  }

  async updateThemePreference(
    userId: string,
    data: UserThemePreferenceUpdate,
  ): Promise<UserThemePreferenceData> {
    const result = await (this.prisma as any).userThemePreference.upsert({
      where: { userId },
      update: {
        ...(data.themeFamily !== undefined ? { themeFamily: data.themeFamily } : {}),
        ...(data.themeName !== undefined ? { themeName: data.themeName } : {}),
        ...(data.colorScheme !== undefined ? { colorScheme: data.colorScheme } : {}),
        ...(data.inputStyle !== undefined ? { inputStyle: data.inputStyle } : {}),
        ...(data.ripple !== undefined ? { ripple: data.ripple } : {}),
        ...(data.scale !== undefined ? { scale: data.scale } : {}),
      },
      create: {
        userId,
        ...this.defaultThemePreference,
        ...data,
      },
    })

    return this.mapThemePreference(result)
  }

  private mapThemePreference(raw: any): UserThemePreferenceData {
    return {
      themeFamily: raw.themeFamily ?? this.defaultThemePreference.themeFamily,
      themeName: raw.themeName ?? this.defaultThemePreference.themeName,
      colorScheme: raw.colorScheme ?? this.defaultThemePreference.colorScheme,
      inputStyle: raw.inputStyle ?? this.defaultThemePreference.inputStyle,
      ripple: raw.ripple ?? this.defaultThemePreference.ripple,
      scale: raw.scale ?? this.defaultThemePreference.scale,
    }
  }

  async getTablePreferences(userId: string, tableName: string): Promise<TablePreferenceData | null> {
    const result = await this.prisma.userTablePreference.findUnique({
      where: { userId_tableName: { userId, tableName } },
    })
    if (!result) return null
    return {
      tableName: result.tableName,
      visibleColumns: result.visibleColumns as string[],
    }
  }

  async saveTablePreferences(userId: string, tableName: string, visibleColumns: string[]): Promise<TablePreferenceData> {
    const result = await this.prisma.userTablePreference.upsert({
      where: { userId_tableName: { userId, tableName } },
      update: { visibleColumns },
      create: { userId, tableName, visibleColumns },
    })
    return {
      tableName: result.tableName,
      visibleColumns: result.visibleColumns as string[],
    }
  }
}
