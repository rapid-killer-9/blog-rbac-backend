// Provide required env vars before any module loads
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests-1234567890';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '4000';
