const fp = require('fastify-plugin');

// Schema definitions
const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 }
  }
};

const registerSchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    name: { type: 'string', minLength: 2 }
  }
};

// Route handlers
module.exports = fp(async (fastify) => {
  // Login route
  fastify.post('/login', {
    schema: {
      description: 'Login user',
      tags: ['auth'],
      body: loginSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;
      
      // TODO: Implement actual authentication logic
      // This is just a placeholder
      if (email === 'test@example.com' && password === 'password') {
        const token = fastify.jwt.sign({ email });
        return {
          token,
          user: {
            id: '1',
            email,
            name: 'Test User'
          }
        };
      }
      
      reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }
  });

  // Register route
  fastify.post('/register', {
    schema: {
      description: 'Register new user',
      tags: ['auth'],
      body: registerSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { email, password, name } = request.body;
      
      // TODO: Implement actual registration logic
      // This is just a placeholder
      reply.code(201).send({
        message: 'User registered successfully',
        user: {
          id: '1',
          email,
          name
        }
      });
    }
  });
}); 