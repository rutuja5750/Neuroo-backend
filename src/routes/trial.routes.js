const fp = require('fastify-plugin');

// Schema definitions
const trialSchema = {
  type: 'object',
  required: ['name', 'protocolNumber', 'sponsor', 'status'],
  properties: {
    name: { type: 'string', minLength: 3 },
    protocolNumber: { type: 'string', pattern: '^[A-Z0-9-]+$' },
    sponsor: { type: 'string' },
    status: { 
      type: 'string',
      enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED']
    },
    description: { type: 'string' },
    startDate: { type: 'string', format: 'date' },
    estimatedEndDate: { type: 'string', format: 'date' },
    actualEndDate: { type: 'string', format: 'date' },
    enrollmentTarget: { type: 'integer', minimum: 0 },
    metadata: { type: 'object' }
  }
};

const querySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    sort: { type: 'string', pattern: '^[a-zA-Z0-9-]+(:(asc|desc))?$' },
    status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED'] }
  }
};

// Route handlers
module.exports = fp(async (fastify) => {
  // Get all trials with pagination and filtering
  fastify.get('/', {
    schema: {
      description: 'Get all trials with pagination and filtering',
      tags: ['trials'],
      querystring: querySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: trialSchema
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { page = 1, limit = 10, sort, status } = request.query;
      
      // Build query
      const query = {};
      if (status) query.status = status;

      // Build sort object
      const sortObj = {};
      if (sort) {
        const [field, direction] = sort.split(':');
        sortObj[field] = direction === 'desc' ? -1 : 1;
      }

      // Execute query with pagination
      const [trials, total] = await Promise.all([
        fastify.models.Trial.find(query)
          .sort(sortObj)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        fastify.models.Trial.countDocuments(query)
      ]);

      return {
        data: trials,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  });

  // Get single trial by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get a single trial by ID',
      tags: ['trials'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: trialSchema,
        404: {
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
      const trial = await fastify.models.Trial.findById(request.params.id).lean();
      
      if (!trial) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Trial not found'
        });
        return;
      }

      return trial;
    }
  });

  // Create new trial
  fastify.post('/', {
    schema: {
      description: 'Create a new trial',
      tags: ['trials'],
      body: trialSchema,
      response: {
        201: trialSchema,
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
      const trial = new fastify.models.Trial(request.body);
      await trial.save();
      
      reply.code(201).send(trial);
    }
  });

  // Update trial
  fastify.put('/:id', {
    schema: {
      description: 'Update a trial',
      tags: ['trials'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        properties: trialSchema.properties
      },
      response: {
        200: trialSchema,
        404: {
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
      const trial = await fastify.models.Trial.findByIdAndUpdate(
        request.params.id,
        { $set: request.body },
        { new: true, runValidators: true }
      ).lean();

      if (!trial) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Trial not found'
        });
        return;
      }

      return trial;
    }
  });

  // Delete trial
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a trial',
      tags: ['trials'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        204: {
          type: 'null'
        },
        404: {
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
      const trial = await fastify.models.Trial.findByIdAndDelete(request.params.id);

      if (!trial) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Trial not found'
        });
        return;
      }

      reply.code(204).send();
    }
  });
}); 