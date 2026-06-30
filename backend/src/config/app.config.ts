import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
}))

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}))

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '2000', 10),
  login: {
    ttl: parseInt(process.env.THROTTLE_LOGIN_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LOGIN_LIMIT ?? '2000', 10),
  },
  register: {
    ttl: parseInt(process.env.THROTTLE_REGISTER_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_REGISTER_LIMIT ?? '2000', 10),
  },
  forgotPassword: {
    ttl: parseInt(process.env.THROTTLE_FORGOT_PASSWORD_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_FORGOT_PASSWORD_LIMIT ?? '2000', 10),
  },
}))

export const mailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST ?? 'smtp.example.com',
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  user: process.env.MAIL_USER ?? '',
  pass: process.env.MAIL_PASS ?? '',
  from: process.env.MAIL_FROM ?? 'noreply@example.com',
  fromName: process.env.MAIL_FROM_NAME ?? 'TemplateNest',
}))
