import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog RBAC API',
      version: '1.0.0',
      description: 'Blog management API with JWT authentication and role-based access control',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SignupRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        BlogCreateRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', example: 'My First Post' },
            content: { type: 'string', example: 'Blog content here...' },
            tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'nodejs'] },
          },
        },
        BlogStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'PUBLISHED'] },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            bio: { type: 'string', example: 'Software engineer' },
            location: { type: 'string', example: 'New York' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/auth/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } } },
          responses: {
            201: { description: 'User created successfully' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get tokens',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenResponse' } } } },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
          responses: {
            200: { description: 'New token pair', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenResponse' } } } },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke refresh token',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/auth/profile': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profile data' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Paginated user list' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User data' },
            404: { description: 'User not found' },
          },
        },
      },
      '/users/profile': {
        patch: {
          tags: ['Users'],
          summary: 'Update own profile',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } } },
          responses: {
            200: { description: 'Profile updated' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/blogs/create': {
        post: {
          tags: ['Blogs'],
          summary: 'Create a new blog post (starts as DRAFT)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BlogCreateRequest' } } } },
          responses: {
            201: { description: 'Blog created' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/blogs': {
        get: {
          tags: ['Blogs'],
          summary: 'List blogs (role-scoped)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Paginated blog list' },
          },
        },
      },
      '/blogs/{id}/status': {
        patch: {
          tags: ['Blogs'],
          summary: 'Update blog status (Admin / Moderator)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BlogStatusRequest' } } } },
          responses: {
            200: { description: 'Status updated' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/blogs/{id}': {
        delete: {
          tags: ['Blogs'],
          summary: 'Soft-delete a blog (author or Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Blog deleted' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/blogs/{id}/restore': {
        post: {
          tags: ['Blogs'],
          summary: 'Restore a soft-deleted blog (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Blog restored' },
            403: { description: 'Forbidden' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
