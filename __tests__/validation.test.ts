import {
  validateSignup,
  validateLogin,
  validateBlogCreation,
  validateProfileUpdate,
  validateBlogStatusUpdate,
} from '../src/utils/validationUtil';

describe('validateSignup', () => {
  it('accepts a valid payload', async () => {
    const result = await validateSignup({ username: 'alice', email: 'alice@example.com', password: 'password123' });
    expect(result).toEqual({ username: 'alice', email: 'alice@example.com', password: 'password123' });
  });

  it('rejects a username shorter than 3 characters', async () => {
    await expect(validateSignup({ username: 'ab', email: 'a@b.com', password: 'password123' })).rejects.toThrow();
  });

  it('rejects an invalid email', async () => {
    await expect(validateSignup({ username: 'alice', email: 'not-an-email', password: 'password123' })).rejects.toThrow();
  });

  it('rejects a password shorter than 8 characters', async () => {
    await expect(validateSignup({ username: 'alice', email: 'alice@example.com', password: 'short' })).rejects.toThrow();
  });

  it('rejects extra fields (strict mode)', async () => {
    await expect(validateSignup({ username: 'alice', email: 'alice@example.com', password: 'password123', role: 'ADMIN' })).rejects.toThrow();
  });
});

describe('validateLogin', () => {
  it('accepts a valid payload', async () => {
    const result = await validateLogin({ email: 'alice@example.com', password: 'password123' });
    expect(result).toEqual({ email: 'alice@example.com', password: 'password123' });
  });

  it('rejects missing password', async () => {
    await expect(validateLogin({ email: 'alice@example.com', password: '' })).rejects.toThrow();
  });

  it('rejects extra fields (strict mode)', async () => {
    await expect(validateLogin({ email: 'alice@example.com', password: 'pass', role: 'ADMIN' })).rejects.toThrow();
  });
});

describe('validateBlogCreation', () => {
  it('accepts a valid payload with tags', async () => {
    const result = await validateBlogCreation({ title: 'My Post', content: 'Some content here', tags: ['ts', 'node'] });
    expect(result.title).toBe('My Post');
    expect(result.tags).toEqual(['ts', 'node']);
  });

  it('accepts a payload without tags', async () => {
    const result = await validateBlogCreation({ title: 'My Post', content: 'Some content here' });
    expect(result.tags).toBeUndefined();
  });

  it('rejects a title shorter than 3 characters', async () => {
    await expect(validateBlogCreation({ title: 'Hi', content: 'Some content here' })).rejects.toThrow();
  });

  it('rejects content shorter than 10 characters', async () => {
    await expect(validateBlogCreation({ title: 'My Post', content: 'Short' })).rejects.toThrow();
  });

  it('rejects extra fields (strict mode)', async () => {
    await expect(validateBlogCreation({ title: 'My Post', content: 'Some content here', authorId: 'injected' })).rejects.toThrow();
  });
});

describe('validateProfileUpdate', () => {
  it('accepts bio and location', async () => {
    const result = await validateProfileUpdate({ bio: 'Engineer', location: 'NYC' });
    expect(result).toEqual({ bio: 'Engineer', location: 'NYC' });
  });

  it('accepts an empty object', async () => {
    const result = await validateProfileUpdate({});
    expect(result).toEqual({});
  });

  it('rejects extra fields (strict mode)', async () => {
    await expect(validateProfileUpdate({ bio: 'ok', role: 'ADMIN' })).rejects.toThrow();
  });
});

describe('validateBlogStatusUpdate', () => {
  it('accepts PUBLISHED', async () => {
    const result = await validateBlogStatusUpdate({ status: 'PUBLISHED' });
    expect(result.status).toBe('PUBLISHED');
  });

  it('accepts DRAFT', async () => {
    const result = await validateBlogStatusUpdate({ status: 'DRAFT' });
    expect(result.status).toBe('DRAFT');
  });

  it('rejects an invalid status value', async () => {
    await expect(validateBlogStatusUpdate({ status: 'ACTIVE' })).rejects.toThrow();
  });

  it('rejects extra fields (strict mode)', async () => {
    await expect(validateBlogStatusUpdate({ status: 'DRAFT', authorId: 'hack' })).rejects.toThrow();
  });
});
