import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const buffer = scryptSync(password, salt, 64);
  return `${buffer.toString('hex')}.${salt}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [hash, salt] = storedHash.split('.');
    const hashBuffer = Buffer.from(hash, 'hex');
    const verifyBuffer = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, verifyBuffer);
  } catch {
    return false;
  }
}
