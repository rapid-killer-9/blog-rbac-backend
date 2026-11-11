import { generateRawToken, hashToken } from '../src/utils/tokenUtil';

describe('generateRawToken', () => {
  it('returns a 96-character hex string', () => {
    const token = generateRawToken();
    expect(token).toHaveLength(96);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('returns a different value on each call', () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });
});

describe('hashToken', () => {
  it('returns a 64-character SHA-256 hex string', () => {
    const hash = hashToken('sometoken');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('token1')).not.toBe(hashToken('token2'));
  });
});
