import { generateToken, verifyToken } from '../src/config/jwtConfig';

describe('generateToken / verifyToken', () => {
  const payload = { userId: 'user-123', role: 'USER' as const };

  it('round-trips a token payload', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws on a tampered token', () => {
    const token = generateToken(payload);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyToken(tampered)).toThrow('Invalid or expired token');
  });

  it('throws on a completely invalid string', () => {
    expect(() => verifyToken('not.a.token')).toThrow('Invalid or expired token');
  });
});
