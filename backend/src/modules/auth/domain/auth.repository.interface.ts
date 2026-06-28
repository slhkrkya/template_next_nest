export const AUTH_REPOSITORY = Symbol('IAuthRepository')

export interface IAuthRepository {
  // Refresh tokens
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findRefreshToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date; isRevoked: boolean } | null>
  findActiveRefreshToken(userId: string, token: string): Promise<{
    id: string; userId: string; expiresAt: Date; isRevoked: boolean;
    user: {
      id: string; email: string; firstName: string; lastName: string;
      isActive: boolean; isSuperAdmin: boolean; tenantId: string | null;
      role?: string;
    };
  } | null>
  revokeRefreshToken(token: string): Promise<void>
  revokeAllUserRefreshTokens(userId: string): Promise<void>

  // Password reset tokens
  createPasswordResetToken(userId: string, email: string, token: string, expiresAt: Date): Promise<void>
  findPasswordResetToken(token: string): Promise<{ id: string; userId: string; email: string; expiresAt: Date; isUsed: boolean } | null>
  findValidPasswordResetToken(token: string): Promise<{ id: string; userId: string; email: string; expiresAt: Date; isUsed: boolean } | null>
  markPasswordResetTokenUsed(token: string): Promise<void>
  invalidateOldPasswordResetTokens(userId: string): Promise<void>

  // User auth operations
  findUserByEmail(email: string): Promise<{
    id: string; email: string; passwordHash: string; firstName: string; lastName: string;
    isActive: boolean; isSuperAdmin: boolean; tenantId: string | null;
    role?: string; lockedUntil: Date | null; failedLoginAttempts: number;
  } | null>
  findUserWithRelations(userId: string): Promise<{
    id: string; email: string; firstName: string; lastName: string;
    isActive: boolean; isSuperAdmin: boolean; tenantId: string | null;
    role?: string; profilePicturePath?: string | null;
    settings?: Record<string, unknown> | null;
    themePreference?: Record<string, unknown> | null;
  } | null>
  updateLastLogin(userId: string): Promise<void>
  incrementFailedLoginAttempts(userId: string): Promise<void>
  resetFailedLoginAttempts(userId: string): Promise<void>
  lockUserUntil(userId: string, until: Date): Promise<void>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  createUser(data: {
    email: string; passwordHash: string; firstName: string; lastName: string;
    tenantId?: string; isSuperAdmin?: boolean; isActive?: boolean;
  }): Promise<{ id: string; email: string; firstName: string; lastName: string; tenantId: string | null; isSuperAdmin: boolean }>
  activateUser(userId: string): Promise<void>
  assignOperationClaimByName(userId: string, claimName: string, tenantId?: string | null): Promise<boolean>
  deleteUser(userId: string): Promise<void>
}
