// Commands
export { LoginCommand } from './login.command';
export { RegisterCommand } from './register.command';
export { LogoutCommand } from './logout.command';
export { ForgotPasswordCommand } from './forgot-password.command';
export { ResetPasswordCommand } from './reset-password.command';
export { RefreshTokenCommand } from './refresh-token.command';
export { VerifyEmailCommand } from './verify-email.command';
export { SwitchTenantCommand } from './switch-tenant.command';

// Handlers
export { LoginHandler } from './handlers/login.handler';
export { RegisterHandler } from './handlers/register.handler';
export { LogoutHandler } from './handlers/logout.handler';
export { ForgotPasswordHandler } from './handlers/forgot-password.handler';
export { ResetPasswordHandler } from './handlers/reset-password.handler';
export { RefreshTokenHandler } from './handlers/refresh-token.handler';
export { VerifyEmailHandler } from './handlers/verify-email.handler';
export { SwitchTenantHandler } from './handlers/switch-tenant.handler';

import { LoginHandler } from './handlers/login.handler';
import { RegisterHandler } from './handlers/register.handler';
import { LogoutHandler } from './handlers/logout.handler';
import { ForgotPasswordHandler } from './handlers/forgot-password.handler';
import { ResetPasswordHandler } from './handlers/reset-password.handler';
import { RefreshTokenHandler } from './handlers/refresh-token.handler';
import { VerifyEmailHandler } from './handlers/verify-email.handler';
import { SwitchTenantHandler } from './handlers/switch-tenant.handler';

export const CommandHandlers = [
  LoginHandler,
  RegisterHandler,
  LogoutHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  RefreshTokenHandler,
  VerifyEmailHandler,
  SwitchTenantHandler,
];
