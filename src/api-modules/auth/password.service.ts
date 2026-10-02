import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return `scrypt$${salt}$${derivedKey.toString('base64url')}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, salt, encodedKey] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || salt === undefined || encodedKey === undefined) {
      return false;
    }

    const expectedKey = Buffer.from(encodedKey, 'base64url');
    const derivedKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;
    return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
  }
}
