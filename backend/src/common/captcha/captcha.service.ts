import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly enabled: boolean;
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<string>('CAPTCHA_ENABLED', 'false') === 'true';
    this.secret = this.config.get<string>('CAPTCHA_SECRET', '');
  }

  async verify(token?: string): Promise<void> {
    if (!this.enabled) return;

    if (!token) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    const body = new URLSearchParams({ secret: this.secret, response: token });

    let data: { success: boolean; 'error-codes'?: string[] };
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      data = (await res.json()) as typeof data;
    } catch (err) {
      this.logger.error('CAPTCHA verification request failed', err);
      throw new BadRequestException('CAPTCHA verification failed');
    }

    if (!data.success) {
      this.logger.warn('CAPTCHA rejected', data['error-codes']);
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }
}
