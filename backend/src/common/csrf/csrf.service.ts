import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CsrfService {
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = config.getOrThrow<string>('COOKIE_SECRET');
  }

  generateToken(): string {
    const random = crypto.randomBytes(32).toString('hex');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(random)
      .digest('hex');
    return `${random}.${signature}`;
  }

  isValidToken(token: string): boolean {
    if (!token || !token.includes('.')) return false;
    const dotIndex = token.lastIndexOf('.');
    const random = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    let expected: Buffer;
    let actual: Buffer;
    try {
      expected = Buffer.from(
        crypto.createHmac('sha256', this.secret).update(random).digest('hex'),
        'hex',
      );
      actual = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  }
}
