require('dotenv').config();
const mongoose = require('mongoose');
const fastify = require('fastify')({
  logger: {
    level: process.env.LOG_LEVEL || 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          userAgent: request.headers['user-agent']
        };
      },
      err(err) {
        return {
          type: err.type,
          message: err.message,
          stack: err.stack,
          code: err.code
        };
      }
    }
  }
});

// Register plugins
const registerPlugins = async () => {
  try {
    console.log('Starting plugin registration...');
    
    // Security plugins
    console.log('Registering helmet plugin...');
    await fastify.register(require('@fastify/helmet'), {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false
    });
    console.log('Helmet plugin registered successfully');

    console.log('Registering cors plugin...');
    await fastify.register(require('@fastify/cors'), {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });
    console.log('CORS plugin registered successfully',process.env.ALLOWED_ORIGINS?.split(','));

    // JWT plugin
    console.log('Registering JWT plugin...');
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      sign: {
        expiresIn: '1d'
      }
    });
    console.log('JWT plugin registered successfully');

    // Rate limiting
    console.log('Registering rate-limit plugin...');
    await fastify.register(require('@fastify/rate-limit'), {
      max: 1000,
      timeWindow: '15 minutes',
      errorResponseBuilder: function (request, context) {
        return {
          code: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded, retry in 15 minutes'
        };
      }
    });
    console.log('Rate-limit plugin registered successfully');

    // Swagger documentation
    console.log('Registering swagger plugin...');
    await fastify.register(require('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'NeuroDoc API Documentation',
          description: 'API documentation for NeuroDoc eTMF application',
          version: '1.0.0'
        },
        host: process.env.API_HOST || 'https://zealous-cliff-08deca50f.6.azurestaticapps.net/',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'trials', description: 'Trial management endpoints' },
          { name: 'documents', description: 'Document management endpoints' },
          { name: 'tmfReferences', description: 'TMF refereneces endpoints'},
        ]
      }
    });
    console.log('Swagger plugin registered successfully');

    console.log('Registering swagger-ui plugin...');
    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });
    console.log('Swagger-ui plugin registered successfully');

    // Register models
    console.log('Registering models...');
    try {
      const User = require('./models/User');
      const Trial = require('./models/Trial');
      const Document = require('./models/Document');
      const { Zone, Section, Artifact, SubArtifact, TMFDocument } = require('./models/TMFReference');
      
      fastify.decorate('models', {
        User,
        Trial,
        Document,
        Zone,
        Section,
        Artifact,
        SubArtifact,
        TMFDocument
      });
      console.log('Models registered successfully');
    } catch (modelError) {
      console.error('Error registering models:', modelError);
      throw modelError;
    }

    // Register routes
    console.log('Registering routes...');
    try {
      await fastify.register(require('./routes'), { prefix: '/api' });
      console.log('Routes registered successfully');
    } catch (routeError) {
      console.error('Error registering routes:', routeError);
      throw routeError;
    }

    // Health check route
    console.log('Registering health check route...');
    fastify.route({
      method: 'GET',
      url: '/health',
      schema: {
        description: 'Health check endpoint',
        tags: ['system'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              memoryUsage: {
                type: 'object',
                properties: {
                  heapUsed: { type: 'number' },
                  heapTotal: { type: 'number' },
                  external: { type: 'number' }
                }
              }
            }
          }
        }
      },
      handler: async () => {
        return {
          status: 'success',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        };
      }
    });
    console.log('Health check route registered successfully');

  } catch (err) {
    console.error('Detailed error during plugin registration:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    throw err;
  }
};

// Database connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    throw error;
  }
};

// Start server
const start = async () => {
  try {
    console.log('Starting server initialization...');
    
    // Register plugins and connect to database
    await registerPlugins();
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 3000;
    console.log(`Starting server on port ${PORT}...`);
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error('Error starting server:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await fastify.close();
    await mongoose.connection.close(false);
    console.log('Server and database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  gracefulShutdown('unhandledRejection');
});

// Start the server
start();