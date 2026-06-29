type TranslateValues = Record<string, string | number | boolean | null | undefined>
type Translate = (key: string, values?: TranslateValues) => string

const systemMessageKeys: Record<string, string> = {
  'common.success': 'messages.success',
  'common.created': 'messages.created',
  'common.updated': 'messages.updated',
  'common.deleted': 'messages.deleted',
  'common.notFound': 'messages.notFound',
  'common.badRequest': 'messages.badRequest',
  'common.unauthorized': 'messages.unauthorized',
  'common.forbidden': 'messages.forbidden',
  'common.internalServerError': 'messages.internalServerError',
  'common.validationFailed': 'messages.validationFailed',
  'common.unexpectedError': 'messages.unexpectedError',
  'common.tooManyRequests': 'messages.tooManyRequests',
  'Validation failed': 'messages.validationFailed',
  'Internal server error': 'messages.internalServerError',
  'Unexpected error': 'messages.unexpectedError',
  'Unauthorized': 'messages.unauthorized',
  'Forbidden': 'messages.forbidden',
  'Bad request': 'messages.badRequest',
  'Too Many Requests': 'messages.tooManyRequests',
  'ThrottlerException: Too Many Requests': 'messages.tooManyRequests',
  'auth.invalidCredentials': 'messages.invalidCredentials',
  'auth.accountLocked': 'messages.accountLocked',
  'auth.emailNotVerified': 'messages.emailNotVerified',
  'auth.emailAlreadyExists': 'messages.emailAlreadyExists',
  'auth.registrationUnavailable': 'messages.registrationUnavailable',
  'auth.registrationSuccessful': 'messages.registrationSuccessful',
  'auth.loggedOut': 'messages.loggedOut',
  'auth.passwordResetSent': 'messages.passwordResetSent',
  'auth.passwordResetSentIfExists': 'messages.passwordResetSentIfExists',
  'auth.passwordResetSuccessful': 'messages.passwordResetSuccessful',
  'auth.passwordResetTokenInvalid': 'messages.passwordResetTokenInvalid',
  'auth.invalidOrExpiredToken': 'messages.invalidOrExpiredToken',
  'auth.invalidRefreshToken': 'messages.invalidRefreshToken',
  'auth.refreshTokenMissing': 'messages.refreshTokenMissing',
  'auth.refreshTokenNotFound': 'messages.refreshTokenNotFound',
  'auth.invalidRefreshTokenPayload': 'messages.invalidRefreshTokenPayload',
  'auth.invalidTokenPayload': 'messages.invalidTokenPayload',
  'auth.emailVerified': 'messages.emailVerified',
  'auth.emailVerifiedSignIn': 'messages.emailVerifiedSignIn',
  'auth.notAuthenticated': 'messages.notAuthenticated',
  'auth.invalidVerificationLink': 'messages.invalidVerificationLink',
  'auth.passwordResetCompleted': 'messages.passwordResetCompleted',
  'auth.currentPasswordIncorrect': 'messages.currentPasswordIncorrect',
  'role.assignedToUser': 'messages.roleAssignedToUser',
  'role.removedFromUser': 'messages.roleRemovedFromUser',
  'Invalid email or password': 'messages.invalidCredentials',
  'Your account is temporarily locked. Please try again later.': 'messages.accountLocked',
  'Please verify your email address before signing in.': 'messages.emailNotVerified',
  'An account with this email address already exists': 'messages.emailAlreadyExists',
  'Registration is currently unavailable. Please try again later.': 'messages.registrationUnavailable',
  'Registration successful. Please verify your email address.': 'messages.registrationSuccessful',
  'Logged out successfully': 'messages.loggedOut',
  'Password reset link sent if the email exists.': 'messages.passwordResetSent',
  'If an account with that email exists, a password reset link has been sent.': 'messages.passwordResetSentIfExists',
  'Password reset successfully.': 'messages.passwordResetSuccessful',
  'Password reset token is invalid or has expired': 'messages.passwordResetTokenInvalid',
  'Invalid or expired token': 'messages.invalidOrExpiredToken',
  'Invalid or expired refresh token': 'messages.invalidRefreshToken',
  'Refresh token not provided': 'messages.refreshTokenMissing',
  'Refresh token not found': 'messages.refreshTokenNotFound',
  'Invalid refresh token payload': 'messages.invalidRefreshTokenPayload',
  'Invalid token payload': 'messages.invalidTokenPayload',
  'Email verified successfully.': 'messages.emailVerified',
  'Email verified successfully. You can now sign in.': 'messages.emailVerifiedSignIn',
  'Not authenticated': 'messages.notAuthenticated',
  'Invalid or expired verification link': 'messages.invalidVerificationLink',
  'Password has been reset successfully. Please log in.': 'messages.passwordResetCompleted',
  'Current password is incorrect': 'messages.currentPasswordIncorrect',
  'Role assigned successfully': 'messages.roleAssignedToUser',
  'Role removed from user successfully': 'messages.roleRemovedFromUser',
  'CSRF token missing': 'messages.csrfTokenMissing',
  'CSRF token mismatch': 'messages.csrfTokenMismatch',
  'CSRF token invalid': 'messages.csrfTokenInvalid',
  'CAPTCHA token is required': 'messages.captchaTokenRequired',
  'CAPTCHA verification failed': 'messages.captchaVerificationFailed',
  'User not authenticated': 'messages.userNotAuthenticated',
  'Access denied': 'messages.accessDenied',
  'Your IP address has been banned.': 'messages.ipBanned',
  'No file provided': 'messages.noFileProvided',
  'No file uploaded': 'messages.noFileUploaded',
}

const systemMessagePatterns: Array<{
  regex: RegExp
  key: string
  values?: (match: RegExpMatchArray) => TranslateValues
}> = [
  { regex: /^ThrottlerException: Too Many Requests$/, key: 'messages.tooManyRequests' },
  { regex: /^Missing required permission: (.+)\.(.+)$/, key: 'messages.missingPermission', values: (match) => ({ entity: match[1], action: match[2] }) },
  { regex: /^Unsupported permission action '(.+)'$/, key: 'messages.unsupportedPermissionAction', values: (match) => ({ action: match[1] }) },
  { regex: /^Tenant (.+) not found$/, key: 'messages.tenantNotFound', values: (match) => ({ id: match[1] }) },
  { regex: /^Tenant "(.+)" is not active$/, key: 'messages.tenantNotActive', values: (match) => ({ name: match[1] }) },
  { regex: /^Slug "(.+)" is already taken$/, key: 'messages.slugTaken', values: (match) => ({ slug: match[1] }) },
  { regex: /^Switched to tenant "(.+)"$/, key: 'messages.tenantSwitched', values: (match) => ({ name: match[1] }) },
  { regex: /^Role with id (.+) not found$/, key: 'messages.roleNotFound', values: (match) => ({ id: match[1] }) },
  { regex: /^User with id (.+) not found$/, key: 'messages.userNotFoundById', values: (match) => ({ id: match[1] }) },
  { regex: /^User with email "(.+)" already exists$/, key: 'messages.userEmailExists', values: (match) => ({ email: match[1] }) },
  { regex: /^A user with email "(.+)" already exists$/, key: 'messages.userEmailExists', values: (match) => ({ email: match[1] }) },
  { regex: /^SubscriptionPlan (.+) not found$/, key: 'messages.subscriptionPlanNotFound', values: (match) => ({ id: match[1] }) },
  { regex: /^Plan with name "(.+)" already exists$/, key: 'messages.planNameExists', values: (match) => ({ name: match[1] }) },
  { regex: /^EntityWorkflow (.+) not found$/, key: 'messages.workflowNotFound', values: (match) => ({ id: match[1] }) },
  { regex: /^RateLimitViolation (.+) not found$/, key: 'messages.rateLimitNotFound', values: (match) => ({ id: match[1] }) },
  { regex: /^IP (.+) is already banned$/, key: 'messages.ipAlreadyBanned', values: (match) => ({ ip: match[1] }) },
  { regex: /^IP (.+) is not banned$/, key: 'messages.ipNotBanned', values: (match) => ({ ip: match[1] }) },
  { regex: /^File "(.+)" not found$/, key: 'messages.fileNotFound', values: (match) => ({ name: match[1] }) },
  { regex: /^Thumbnail "(.+)" not found$/, key: 'messages.thumbnailNotFound', values: (match) => ({ name: match[1] }) },
  { regex: /^File extension "(.+)" is not allowed$/, key: 'messages.fileExtensionNotAllowed', values: (match) => ({ ext: match[1] }) },
  { regex: /^MIME type "(.+)" is not allowed$/, key: 'messages.mimeTypeNotAllowed', values: (match) => ({ type: match[1] }) },
  { regex: /^Email parameters not configured for tenant (.+)$/, key: 'messages.emailParametersNotConfigured', values: (match) => ({ tenantId: match[1] }) },
  { regex: /^(.+) with id (.+) not found$/, key: 'messages.entityNotFound', values: (match) => ({ entity: match[1], id: match[2] }) },
]

const auditActionKeys: Record<string, string> = {
  CREATE: 'actions.CREATE',
  READ: 'actions.READ',
  UPDATE: 'actions.UPDATE',
  DELETE: 'actions.DELETE',
  LOGIN: 'actions.LOGIN',
  LOGOUT: 'actions.LOGOUT',
}

const auditEntityKeys: Record<string, string> = {
  AuditLogs: 'entities.AuditLogs',
  DataScopes: 'entities.DataScopes',
  EmailParameters: 'entities.EmailParameters',
  EntityWorkflow: 'entities.EntityWorkflow',
  Files: 'entities.Files',
  IpBans: 'entities.IpBans',
  Notifications: 'entities.Notifications',
  PermissionEntity: 'entities.PermissionEntity',
  Permissions: 'entities.Permissions',
  RateLimitViolation: 'entities.RateLimitViolation',
  Roles: 'entities.Roles',
  SubscriptionPlan: 'entities.SubscriptionPlan',
  SystemLogs: 'entities.SystemLogs',
  Tenant: 'entities.Tenant',
  Tenants: 'entities.Tenants',
  User: 'entities.User',
  Users: 'entities.Users',
  Workflow: 'entities.Workflow',
}

const auditFieldKeys: Record<string, string> = {
  email: 'fields.email',
  firstName: 'fields.firstName',
  lastName: 'fields.lastName',
  name: 'fields.name',
  displayName: 'fields.displayName',
  description: 'fields.description',
  status: 'fields.status',
  role: 'fields.role',
  isActive: 'fields.isActive',
  isEmailVerified: 'fields.isEmailVerified',
  tenantId: 'fields.tenantId',
  tenantName: 'fields.tenantName',
  slug: 'fields.slug',
  maxUsers: 'fields.maxUsers',
  trialEndsAt: 'fields.trialEndsAt',
  monthlyPrice: 'fields.monthlyPrice',
  yearlyPrice: 'fields.yearlyPrice',
  entityName: 'fields.entityName',
  entityId: 'fields.entityId',
  userId: 'fields.userId',
  action: 'fields.action',
  ipAddress: 'fields.ipAddress',
  createdAt: 'fields.createdAt',
  updatedAt: 'fields.updatedAt',
}

function translateKnown(t: Translate, key: string, values?: TranslateValues) {
  try {
    return t(key, values)
  } catch {
    return null
  }
}

export function translateSystemLogMessage(message: string, t: Translate): string {
  const directKey = systemMessageKeys[message]
  if (directKey) return translateKnown(t, directKey) ?? message

  for (const pattern of systemMessagePatterns) {
    const match = message.match(pattern.regex)
    if (match) {
      return translateKnown(t, pattern.key, pattern.values?.(match)) ?? message
    }
  }

  return message
}

export function translateLogLevel(level: string, t: Translate): string {
  return translateKnown(t, `levels.${level}`) ?? level
}

export function translateAuditAction(action: string, t: Translate): string {
  const key = auditActionKeys[action]
  return key ? translateKnown(t, key) ?? action : action
}

export function translateAuditEntity(entity: string, t: Translate): string {
  const key = auditEntityKeys[entity]
  return key ? translateKnown(t, key) ?? entity : entity
}

export function translateAuditField(field: string, t: Translate): string {
  const key = auditFieldKeys[field]
  return key ? translateKnown(t, key) ?? field : field
}
