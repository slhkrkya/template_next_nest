import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IAuthRepository } from '../domain/auth.repository.interface'

/**
 * Picks the most privileged claim name from a user's operation claims.
 * Higher priority wins; when tied, any non-'User' claim is preferred over 'User'
 * so that a newly assigned custom role is reflected in the JWT immediately.
 */
function pickEffectiveRole(claims: Array<{ name: string; priority?: number | null }>): string | undefined {
  if (!claims.length) return undefined;
  const sorted = [...claims].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    const aIsUser = a.name.toLowerCase() === 'user' ? 1 : 0;
    const bIsUser = b.name.toLowerCase() === 'user' ? 1 : 0;
    return aIsUser - bIsUser;
  });
  return sorted[0].name;
}

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }

  async findUserByEmail(email: string) {
    const raw = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, passwordHash: true, firstName: true, lastName: true,
        isActive: true, isSuperAdmin: true, tenantId: true,
        lockedUntil: true, failedLoginAttempts: true,
        operationClaims: { select: { operationClaim: { select: { name: true, priority: true } } } },
      },
    })
    if (!raw) return null
    return {
      id: raw.id, email: raw.email, passwordHash: raw.passwordHash,
      firstName: raw.firstName, lastName: raw.lastName, isActive: raw.isActive,
      isSuperAdmin: raw.isSuperAdmin, tenantId: raw.tenantId ?? null,
      role: pickEffectiveRole(raw.operationClaims.map(c => c.operationClaim)),
      lockedUntil: raw.lockedUntil, failedLoginAttempts: raw.failedLoginAttempts,
    }
  }

  async findUserWithRelations(userId: string) {
    const raw = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        operationClaims: { include: { operationClaim: true } },
        settings: true,
        themePreference: true,
      },
    })
    if (!raw) return null
    return {
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      isActive: raw.isActive,
      isSuperAdmin: raw.isSuperAdmin,
      tenantId: raw.tenantId ?? null,
      role: pickEffectiveRole(((raw as any).operationClaims ?? []).map((c: any) => c.operationClaim)),
      profilePicturePath: (raw as any).profilePicturePath ?? null,
      settings: (raw as any).settings ?? null,
      themePreference: (raw as any).themePreference ?? null,
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date(), failedLoginAttempts: 0 } })
  }

  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: { increment: 1 } } })
  }

  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } })
  }

  async lockUserUntil(userId: string, until: Date): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lockedUntil: until } })
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  }

  async createUser(data: any) {
    const raw = await this.prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email, passwordHash: data.passwordHash,
        firstName: data.firstName, lastName: data.lastName,
        tenantId: data.tenantId ?? null, isSuperAdmin: data.isSuperAdmin ?? false,
        isActive: data.isActive ?? true,
        settings: { create: { language: 'en', themePreset: 'default', colorScheme: 'light', timezoneOffset: 0 } },
        themePreference: {
          create: {
            themeFamily: 'lara',
            themeName: 'indigo',
            colorScheme: 'light',
            inputStyle: 'outlined',
            ripple: true,
            scale: 14,
          },
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true, tenantId: true, isSuperAdmin: true },
    })
    return { ...raw, tenantId: raw.tenantId ?? null }
  }

  async activateUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })
  }

  async assignOperationClaimByName(userId: string, claimName: string, tenantId?: string | null): Promise<boolean> {
    const operationClaim = await this.prisma.operationClaim.findUnique({
      where: { name: claimName },
      select: { id: true },
    })

    if (!operationClaim) return false

    const existing = await this.prisma.userOperationClaim.findFirst({
      where: {
        userId,
        operationClaimId: operationClaim.id,
        tenantId: tenantId ?? null,
      },
    })

    if (existing) return true

    await this.prisma.userOperationClaim.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        operationClaimId: operationClaim.id,
        tenantId: tenantId ?? null,
      },
    })

    return true
  }

  async deleteUser(userId: string): Promise<void> {
    await (this.prisma as any).userThemePreference.deleteMany({ where: { userId } })
    await this.prisma.userSettings.deleteMany({ where: { userId } })
    await this.prisma.user.delete({ where: { id: userId } })
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { id: crypto.randomUUID(), userId, token, expiresAt } })
  }

  async findRefreshToken(token: string) {
    const raw = await this.prisma.refreshToken.findUnique({ where: { token } })
    if (!raw) return null
    return { id: raw.id, userId: raw.userId, expiresAt: raw.expiresAt, isRevoked: raw.isRevoked }
  }

  async findActiveRefreshToken(userId: string, token: string) {
    const raw = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { operationClaims: { include: { operationClaim: true } } } },
      },
    })
    if (!raw) return null
    return {
      id: raw.id,
      userId: raw.userId,
      expiresAt: raw.expiresAt,
      isRevoked: raw.isRevoked,
      user: {
        id: raw.user.id,
        email: raw.user.email,
        firstName: raw.user.firstName,
        lastName: raw.user.lastName,
        isActive: raw.user.isActive,
        isSuperAdmin: raw.user.isSuperAdmin,
        tenantId: raw.user.tenantId ?? null,
        role: pickEffectiveRole(((raw.user as any).operationClaims ?? []).map((c: any) => c.operationClaim)),
      },
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { token }, data: { isRevoked: true } })
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } })
  }

  async createPasswordResetToken(userId: string, email: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.create({ data: { id: crypto.randomUUID(), userId, email, token, expiresAt } })
  }

  async findPasswordResetToken(token: string) {
    const raw = await this.prisma.passwordResetToken.findUnique({ where: { token } })
    if (!raw) return null
    return { id: raw.id, userId: raw.userId, email: raw.email, expiresAt: raw.expiresAt, isUsed: raw.isUsed }
  }

  async findValidPasswordResetToken(token: string) {
    const raw = await this.prisma.passwordResetToken.findFirst({
      where: { token, isUsed: false, expiresAt: { gt: new Date() } },
    })
    if (!raw) return null
    return { id: raw.id, userId: raw.userId, email: raw.email, expiresAt: raw.expiresAt, isUsed: raw.isUsed }
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordResetToken.update({ where: { token }, data: { isUsed: true } })
  }

  async invalidateOldPasswordResetTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true },
    })
  }
}
