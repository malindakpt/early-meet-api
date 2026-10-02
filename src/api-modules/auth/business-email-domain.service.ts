import { Injectable } from '@nestjs/common';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'aol.com',
  'gmail.com',
  'gmx.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'mail.com',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.com',
]);

@Injectable()
export class BusinessEmailDomainService {
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  getDomain(email: string): string {
    return this.normalizeEmail(email).split('@')[1] ?? '';
  }

  isPersonalDomain(domain: string): boolean {
    return PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
  }
}
