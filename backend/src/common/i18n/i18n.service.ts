import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import {
  DEFAULT_LOCALE,
  Locale,
  literalMessageKeys,
  messages,
  SUPPORTED_LOCALES,
} from './i18n.messages';

type Params = Record<string, string | number | boolean | null | undefined>;

@Injectable()
export class I18nService {
  private readonly storage = new AsyncLocalStorage<Locale>();

  runWithLocale<T>(locale: string | undefined, callback: () => T): T {
    return this.storage.run(this.resolveLocale(locale), callback);
  }

  currentLocale(): Locale {
    return this.storage.getStore() ?? DEFAULT_LOCALE;
  }

  resolveLocale(value: string | undefined): Locale {
    if (!value) return DEFAULT_LOCALE;

    const candidates = value
      .split(',')
      .map((part) => part.trim().split(';')[0]?.toLowerCase())
      .filter(Boolean);

    for (const candidate of candidates) {
      const base = candidate.split('-')[0];
      if (SUPPORTED_LOCALES.includes(candidate as Locale)) return candidate as Locale;
      if (SUPPORTED_LOCALES.includes(base as Locale)) return base as Locale;
    }

    return DEFAULT_LOCALE;
  }

  t(key: string, params: Params = {}): string {
    const locale = this.currentLocale();
    const template =
      this.getMessage(locale, key) ??
      this.getMessage(DEFAULT_LOCALE, key) ??
      key;

    return this.interpolate(template, params);
  }

  translateMessage(message: unknown): unknown {
    if (typeof message !== 'string') return message;
    const patternTranslation = this.translatePattern(message);
    if (patternTranslation) return patternTranslation;
    const key = literalMessageKeys[message] ?? message;
    return this.t(key);
  }

  private getMessage(locale: Locale, key: string): string | undefined {
    const value = key.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, messages[locale]);

    return typeof value === 'string' ? value : undefined;
  }

  private interpolate(template: string, params: Params): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = params[key];
      return value === undefined || value === null ? `{${key}}` : String(value);
    });
  }

  private translatePattern(message: string): string | null {
    const patterns: Array<{
      regex: RegExp;
      key: string;
      params: (match: RegExpMatchArray) => Params;
    }> = [
      {
        regex: /^Tenant (.+) not found$/,
        key: 'tenant.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^Slug "(.+)" is already taken$/,
        key: 'tenant.slugTaken',
        params: (match) => ({ slug: match[1] }),
      },
      {
        regex: /^Switched to tenant "(.+)"$/,
        key: 'tenant.switched',
        params: (match) => ({ name: match[1] }),
      },
      {
        regex: /^Role with id (.+) not found$/,
        key: 'role.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^User with id (.+) not found$/,
        key: 'user.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^SubscriptionPlan (.+) not found$/,
        key: 'subscriptionPlan.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^Plan with name "(.+)" already exists$/,
        key: 'subscriptionPlan.nameExists',
        params: (match) => ({ name: match[1] }),
      },
      {
        regex: /^EntityWorkflow (.+) not found$/,
        key: 'workflow.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^RateLimitViolation (.+) not found$/,
        key: 'rateLimit.notFoundById',
        params: (match) => ({ id: match[1] }),
      },
      {
        regex: /^(.+) with id (.+) not found$/,
        key: 'permission.entityNotFound',
        params: (match) => ({ entity: match[1], id: match[2] }),
      },
      {
        regex: /^Unsupported permission action '(.+)'$/,
        key: 'common.unsupportedPermissionAction',
        params: (match) => ({ action: match[1] }),
      },
      {
        regex: /^Missing required permission: (.+)\.(.+)$/,
        key: 'permission.missingPermission',
        params: (match) => ({ entity: match[1], action: match[2] }),
      },
      {
        regex: /^Invalid status\. Must be one of: (.+)$/,
        key: 'tenant.invalidStatus',
        params: (match) => ({ statuses: match[1] }),
      },
      {
        regex: /^IP (.+) is already banned$/,
        key: 'ipBan.alreadyBanned',
        params: (match) => ({ ip: match[1] }),
      },
      {
        regex: /^IP (.+) is not banned$/,
        key: 'ipBan.notBanned',
        params: (match) => ({ ip: match[1] }),
      },
      {
        regex: /^File "(.+)" not found$/,
        key: 'file.fileNotFound',
        params: (match) => ({ name: match[1] }),
      },
      {
        regex: /^Thumbnail "(.+)" not found$/,
        key: 'file.thumbnailNotFound',
        params: (match) => ({ name: match[1] }),
      },
      {
        regex: /^Email parameters not configured for tenant (.+)$/,
        key: 'email.parametersNotConfigured',
        params: (match) => ({ tenantId: match[1] }),
      },
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) return this.t(pattern.key, pattern.params(match));
    }

    return null;
  }
}
