import crypto from 'crypto';

export const generateRawToken = (): string => crypto.randomBytes(48).toString('hex');

export const hashToken = (raw: string): string =>
  crypto.createHash('sha256').update(raw).digest('hex');
