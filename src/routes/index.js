const fp = require('fastify-plugin');

// Import route modules
const authRoutes = require('./auth.routes');
const trialRoutes = require('./trial.routes');
const documentRoutes = require('./document.routes');

const tmfReferenceRoutes = require('./tmfReference.routes');


// Register routes as a plugin
module.exports = fp(async (fastify, opts) => {
  const routePrefix = opts.prefix || ''; // Ensure prefix is defined

  await fastify.register(authRoutes, { prefix: `${routePrefix}/users` });
  await fastify.register(trialRoutes, { prefix: `${routePrefix}/trials` });
  await fastify.register(tmfReferenceRoutes, { prefix: `${routePrefix}/tmf` });
  await fastify.register(documentRoutes, { prefix: `${routePrefix}/documents` });

  
  console.log('All routes registered successfully', routePrefix);

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    // Handle validation errors
    if (error.validation) {
      reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message
      });
      return;
    }

    // Handle not found errors
    if (error.statusCode === 404) {
      reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    // Handle unauthorized errors
    if (error.statusCode === 401) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: error.message
      });
      return;
    }

    // Handle forbidden errors
    if (error.statusCode === 403) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    // Handle other errors
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message
    });
  });

  // Global not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`
    });
  });
}); 