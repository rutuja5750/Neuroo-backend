const fp = require('fastify-plugin');

// Schema definitions
const documentSchema = {
  type: 'object',
  properties: {
    documentId: { type: 'string' },
    title: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string' },
    documentType: { 
      type: 'string',
      enum: ['PROTOCOL', 'INVESTIGATOR_BROCHURE', 'INFORMED_CONSENT', 'REGULATORY_DOCUMENT', 'CLINICAL_REPORT', 'SAFETY_REPORT', 'QUALITY_DOCUMENT', 'TRAINING_DOCUMENT', 'OTHER']
    },
    tmfReference: { type: 'string' },
    version: { type: 'number', default: 1 },
    study: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
    country: { type: 'string' },
    site: { type: 'string' },
    fileUrl: { type: 'string' },
    fileSize: { type: 'number' },
    mimeType: { type: 'string' },
    pageCount: { type: 'number' },
    language: { type: 'string', default: 'en' },
    documentDate: { type: 'string', format: 'date-time' },
    author: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
    uploadedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
    status: {
      type: 'string',
      enum: ['DRAFT', 'IN_REVIEW', 'IN_QC', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED', 'EXPIRED'],
      default: 'DRAFT'
    }
  }
};

// Schema for document creation/update
const createDocumentSchema = {
  ...documentSchema,
  required: ['documentId', 'title', 'documentType', 'tmfReference', 'study', 'country', 'site', 'fileUrl', 'fileSize', 'mimeType', 'documentDate', 'author', 'uploadedBy']
};

const querySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    sort: { type: 'string', pattern: '^[a-zA-Z0-9-]+(:(asc|desc))?$' },
    documentType: { 
      type: 'string',
      enum: ['PROTOCOL', 'INVESTIGATOR_BROCHURE', 'INFORMED_CONSENT', 'REGULATORY_DOCUMENT', 'CLINICAL_REPORT', 'SAFETY_REPORT', 'QUALITY_DOCUMENT', 'TRAINING_DOCUMENT', 'OTHER']
    },
    status: { 
      type: 'string',
      enum: ['DRAFT', 'IN_REVIEW', 'IN_QC', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED', 'EXPIRED']
    },
    study: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
  }
};

// Route handlers
module.exports = fp(async (fastify, opts) => {
  const prefix = opts.prefix || '/documents';

  // Get all documents with pagination and filtering
  fastify.get(`${prefix}`, {
    schema: {
      description: 'Get all documents with pagination and filtering',
      tags: ['documents'],
      querystring: querySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: documentSchema
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
      const { page = 1, limit = 10, sort, documentType, status, study } = request.query;
      
      // Build query
      const query = {};
      if (documentType) query.documentType = documentType;
      if (status) query.status = status;
      if (study) query.study = study;

      // Build sort object
      const sortObj = {};
      if (sort) {
        const [field, direction] = sort.split(':');
        sortObj[field] = direction === 'desc' ? -1 : 1;
      }

      // Execute query with pagination
      const [documents, total] = await Promise.all([
        fastify.models.Document.find(query)
          .sort(sortObj)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        fastify.models.Document.countDocuments(query)
      ]);

      return {
        data: documents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }
  });

  // Get single document by ID
  fastify.get(`${prefix}/:id`, {
    schema: {
      description: 'Get a single document by ID',
      tags: ['documents'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: documentSchema,
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
      const document = await fastify.models.Document.findById(request.params.id).lean();
      
      if (!document) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found'
        });
        return;
      }

      return document;
    }
  });

  // Create new document
  fastify.post(`${prefix}`, {
    schema: {
      description: 'Create a new document',
      tags: ['documents'],
      body: createDocumentSchema,
      response: {
        201: documentSchema,
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
      const document = new fastify.models.Document(request.body);
      await document.save();
      
      reply.code(201).send(document);
    }
  });

  // Update document
  fastify.put(`${prefix}/:id`, {
    schema: {
      description: 'Update a document',
      tags: ['documents'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        properties: documentSchema.properties
      },
      response: {
        200: documentSchema,
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
      const document = await fastify.models.Document.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true }
      ).lean();
      
      if (!document) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found'
        });
        return;
      }

      return document;
    }
  });

  // Delete document
  fastify.delete(`${prefix}/:id`, {
    schema: {
      description: 'Delete a document',
      tags: ['documents'],
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
      const document = await fastify.models.Document.findByIdAndDelete(request.params.id);
      
      if (!document) {
        reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found'
        });
        return;
      }

      reply.code(204).send();
    }
  });
}); 