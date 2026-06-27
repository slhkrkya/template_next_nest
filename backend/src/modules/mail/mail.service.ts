import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'
import { I18nService } from '../../common/i18n'

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('mail.host')
    const port = this.configService.get<number>('mail.port')
    const user = this.configService.get<string>('mail.user')
    const pass = this.configService.get<string>('mail.pass')

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    })

    this.logger.log(`Mail transporter initialized (${host}:${port})`)
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get<string>('mail.from')
    const fromName = this.configService.get<string>('mail.fromName')

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to,
        subject,
        html,
      })
      this.logger.log(`Email sent to ${to}: ${subject}`)
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`, (error as Error).stack)
      throw error
    }
  }

  async sendPasswordReset(to: string, token: string, frontendUrl: string): Promise<void> {
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${this.i18n.t('email.passwordResetTitle')}</h2>
        <p>${this.i18n.t('email.passwordResetMessage')}</p>
        <p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
          ">${this.i18n.t('email.passwordResetButton')}</a>
        </p>
        <p>${this.i18n.t('email.passwordResetExpiry')}</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          ${this.i18n.t('email.fallbackUrl')}<br />
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `

    await this.sendMail(to, this.i18n.t('email.passwordResetSubject'), html)
  }

  async sendEmailVerification(to: string, firstName: string, token: string, frontendUrl: string): Promise<void> {
    const appName = this.configService.get<string>('mail.fromName')
    const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${this.i18n.t('email.verifyTitle', { appName })}</h2>
        <p>${this.i18n.t('email.verifyGreeting', { firstName })}</p>
        <p>${this.i18n.t('email.verifyMessage')}</p>
        <p>
          <a href="${verifyUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
          ">${this.i18n.t('email.verifyButton')}</a>
        </p>
        <p>${this.i18n.t('email.verifyExpiry')}</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          ${this.i18n.t('email.fallbackUrl')}<br />
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `

    await this.sendMail(to, this.i18n.t('email.verifySubject', { appName }), html)
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    const appName = this.configService.get<string>('mail.fromName')
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${this.i18n.t('email.welcomeTitle', { appName, firstName })}</h2>
        <p>${this.i18n.t('email.welcomeMessage')}</p>
        <p>${this.i18n.t('email.welcomeStart')}</p>
        <p>${this.i18n.t('email.welcomeHelp')}</p>
        <p>${this.i18n.t('email.welcomeSignature', { appName })}</p>
      </div>
    `

    await this.sendMail(to, this.i18n.t('email.welcomeSubject', { appName }), html)
  }
}
