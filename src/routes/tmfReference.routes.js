const fp = require('fastify-plugin');
const { uploadToAzure } = require("../services/azure.upload");

const zoneController = require("../controllers/zone.controller");
const sectionController = require("../controllers/section.controller");
const artifactController = require("../controllers/artifact.controller");
const subArtifactController = require("../controllers/subArtifact.controller");


const { zoneSchema, idParamSchema } = require("../schemas/zone.schema");
const { sectionSchema, sectionInputSchema, zoneIdParamSchema } = require("../schemas/section.schema");

const { documentSchema, userIdParamSchema } = require("../schemas/document.schema");

module.exports = fp(async (fastify, opts) => {
  
  fastify.register(require("@fastify/multipart"));
  
  const routePrefix = opts.prefix; 

  // Zone Routes
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/zones`,
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              zoneNumber: { type: 'number' },
              zoneName: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: zoneController.getZones
  });

  // Get a specific zone by ID
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/zones/:id`,
    schema: {
      params: idParamSchema,
      response: {
        200: zoneSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: zoneController.getZoneById
  });

  // Create a new zone
  fastify.route({
    method: 'POST',
    url: `${routePrefix}/zones`,
    schema: {
      body: {
        type: 'object',
        required: ['zoneNumber', 'zoneName'],
        properties: {
          zoneNumber: { type: 'number' },
          zoneName: { type: 'string', minLength: 1 },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        201: zoneSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
    handler: zoneController.createZone
  });


   // Section Routes
  // Get all sections for a specific zone
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/zones/:zoneId/sections`,
    schema: {
      params: zoneIdParamSchema,
      response: {
        200: {
          type: 'array',
          items: sectionSchema
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: sectionController.getSectionsByZoneId
  });

  // Get a specific section by ID
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/sections/:id`,
    schema: {
      params: idParamSchema,
      response: {
        200: sectionSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: sectionController.getSectionById
  });
  

   // Create a new section for a specific zone
   fastify.route({
    method: 'POST',
    url: `${routePrefix}/zones/:zoneId/sections`,
    schema: {
      params: zoneIdParamSchema,
      body: sectionInputSchema,
      response: {
        201: sectionSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: sectionController.createSection  
  });



  // Artifact Routes
  // Get all artifacts for a specific section
  fastify.get(`${routePrefix}/sections/:sectionId/artifacts`, {
    schema: {
      params: {
        type: 'object',
        required: ['sectionId'],
        properties: {
          sectionId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              artifactNumber: { type: 'string' },
              artifactName: { type: 'string' },
              section: { type: 'string' },
              ichCode: { type: 'string' },
              isRequired: { type: 'boolean' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: artifactController.getArtifactsBySectionId
  });

  // Get a specific artifact by ID
  fastify.get(`${routePrefix}/artifacts/:id`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            artifactNumber: { type: 'string' },
            artifactName: { type: 'string' },
            section: { type: 'string' },
            ichCode: { type: 'string' },
            isRequired: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: artifactController.getArtifactById
      
  });

  // Create a new artifact for a specific section
  fastify.post(`${routePrefix}/sections/:sectionId/artifacts`, {
    schema: {
      params: {
        type: 'object',
        required: ['sectionId'],
        properties: {
          sectionId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        required: ['artifactNumber', 'artifactName'],
        properties: {
          artifactNumber: { type: 'string' },
          artifactName: { type: 'string' },
          ichCode: { type: 'string' },
          isRequired: { type: 'boolean' },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            artifactNumber: { type: 'string' },
            artifactName: { type: 'string' },
            section: { type: 'string' },
            ichCode: { type: 'string' },
            isRequired: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
    handler: artifactController.createArtifact
  });


  // SubArtifact Routes
   // Get all subartifacts for a specific artifact
   fastify.get(`${routePrefix}/artifacts/:artifactId/subartifacts`, {
    schema: {
      params: {
        type: 'object',
        required: ['artifactId'],
        properties: {
          artifactId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              subArtifactNumber: { type: 'string' },
              subArtifactName: { type: 'string' },
              artifact: { type: 'string' },
              isRequired: { type: 'boolean' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: subArtifactController.getSubArtifactsByArtifactId
  });

  // Get a specific subartifact by ID
  fastify.get(`${routePrefix}/subartifacts/:id`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            subArtifactNumber: { type: 'string' },
            subArtifactName: { type: 'string' },
            artifact: { type: 'string' },
            isRequired: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: subArtifactController.getSubArtifactById
  });


  // Create a new subartifact for a specific artifact
  fastify.post(`${routePrefix}/artifacts/:artifactId/subartifacts`, {
    schema: {
      params: {
        type: 'object',
        required: ['artifactId'],
        properties: {
          artifactId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        required: ['subArtifactNumber', 'subArtifactName'],
        properties: {
          subArtifactNumber: { type: 'string' },
          subArtifactName: { type: 'string' },
          isRequired: { type: 'boolean' },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            subArtifactNumber: { type: 'string' },
            subArtifactName: { type: 'string' },
            artifact: { type: 'string' },
            isRequired: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
    handler: subArtifactController.createSubArtifact
  });


  

  // Upload a new document
  fastify.route({
    method: 'POST',
    url: `${routePrefix}/documents/:userId`,
    schema: {
      params: userIdParamSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            document: documentSchema
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request, reply) => {
      try {
        const parts = request.parts();
        let metadata = {};
        let fileData = null;

        for await (const part of parts) {
          if (part.type === "file") {
            // Process file data
            const buffer = await part.toBuffer();
            fileData = {
              buffer,
              originalname: part.filename,
              mimetype: part.mimetype,
              size: buffer.length,
            };
          } else {
            // Process metadata (assuming it's a JSON string)
            if (part.fieldname === "metadata") {
              try {
                metadata = JSON.parse(part.value);
              } catch (parseError) {
                throw new Error(`Invalid metadata JSON: ${parseError.message}`);
              }
            }
          }
        }

        if (!fileData) {
          throw new Error("No file uploaded");
        }

        request.file = fileData;
        request.metadata = metadata;
      } catch (error) {
        fastify.log.error(`Multipart processing error: ${error.message}`);
        return reply.code(400).send({ message: error.message });
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId } = request.params;

        if (!request.file) {
          return reply.code(400).send({ message: "No file uploaded" });
        }

        // Validate required fields in metadata
        if (!request.metadata.documentTitle || !request.metadata.version) {
          return reply.code(400).send({ 
            message: "Required fields missing: documentTitle and version are required" 
          });
        }

        // Upload file to Azure
        const fileUrl = await uploadToAzure(
          request.file.buffer,
          request.file.originalname,
          request.file.mimetype
        );

        fastify.log.info(`File uploaded: ${request.file.originalname}, URL: ${fileUrl}`);
        fastify.log.info(`Parsed Metadata: ${JSON.stringify(request.metadata)}`);

        // Save document metadata to MongoDB
        const document = new fastify.models.Document({
          ...request.metadata, // Spread metadata properties
          fileName: request.file.originalname,
          fileSize: request.file.size,
          fileFormat: request.file.mimetype,
          fileUrl: fileUrl,
          createdBy: userId,
          lastModifiedBy: userId,
        });

        await document.save();

        // Populate document with referenced data
        const populatedDocument = await fastify.models.Document.findById(document._id)
          .populate({ path: 'createdBy', select: 'userName' })
          .populate({ path: 'lastModifiedBy', select: 'userName' })
          .populate({ path: 'zone', select: 'zoneName' })
          .populate({ path: 'section', select: 'sectionName' })
          .populate({ path: 'artifact', select: 'artifactName' })
          .populate({ path: 'subArtifact', select: 'subArtifactName' });

        reply.code(201).send({ 
          message: "Document uploaded successfully", 
          document: populatedDocument 
        });
      } catch (error) {
        fastify.log.error(`Error creating document: ${error}`);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
          return reply.code(400).send({ 
            message: "Validation error", 
            details: error.message 
          });
        }
        
        reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  });

  // Get all documents
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/documents`,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          zone: { type: 'string' },
          section: { type: 'string' },
          status: { type: 'string' },
          limit: { type: 'integer', default: 100 },
          skip: { type: 'integer', default: 0 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        // Build query from parameters
        const query = {};
        if (request.query.zone) query.zone = request.query.zone;
        if (request.query.section) query.section = request.query.section;
        if (request.query.status) query.status = request.query.status;
        
        // Add pagination
        const limit = parseInt(request.query.limit) || 100;
        const skip = parseInt(request.query.skip) || 0;
        
        const documents = await fastify.models.Document.find(query)
          .limit(limit)
          .skip(skip)
          .populate({ path: 'createdBy', select: 'userName' })
          .populate({ path: 'lastModifiedBy', select: 'userName' })
          .populate('zone')
          .populate('section')
          .populate('artifact')
          .populate('subArtifact');
        
        return documents;
      } catch (error) {
        fastify.log.error("Error fetching documents:", error);
        return reply.code(500).send({ 
          message: "Internal Server Error", 
          error: error.message 
        });
      }
    }
  });


  // Get a document by ID
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/documents/:id`,
    schema: {
      params: idParamSchema,
      response: {
        200: documentSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const document = await fastify.models.Document.findById(request.params.id)
          .populate({ path: 'createdBy', select: 'userName' })
          .populate({ path: 'lastModifiedBy', select: 'userName' })
          .populate({ path: 'zone', select: 'zoneName zoneNumber isActive' })
          .populate({ path: 'section', select: 'sectionName sectionNumber isActive' })
          .populate({ path: 'artifact', select: 'artifactName artifactNumber isActive' })
          .populate({ path: 'subArtifact', select: 'subArtifactName subArtifactNumber isActive' });
        
        if (!document) {
          return reply.code(404).send({ message: "Document not found" });
        }
        
        return document;
      } catch (error) {
        fastify.log.error(`Error fetching document: ${error}`);
        return reply.code(500).send({ 
          message: "Internal Server Error", 
          error: error.message 
        });
      }
    }
  });

  // Comment Routes
  // Get all comments for a document
  fastify.route({
    method: 'GET',
    url: `${routePrefix}/documents/:documentId/comments`,
    schema: {
      params: {
        type: 'object',
        required: ['documentId'],
        properties: {
          documentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              content: { type: 'string' },
              user: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const document = await fastify.models.Document.findById(request.params.documentId)
          .populate('comments.user', 'userName');
        
        if (!document) {
          return reply.code(404).send({ message: "Document not found" });
        }
        
        return document.comments;
      } catch (error) {
        fastify.log.error(`Error fetching comments: ${error}`);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  });

  // Add a comment to a document
  fastify.route({
    method: 'POST',
    url: `${routePrefix}/documents/:documentId/comments`,
    schema: {
      params: {
        type: 'object',
        required: ['documentId'],
        properties: {
          documentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        required: ['content', 'userId'],
        properties: {
          content: { type: 'string', minLength: 1 },
          userId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  user: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                  replies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        content: { type: 'string' },
                        user: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { documentId } = request.params;
        const { content, userId } = request.body;

        // Log incoming request data
        fastify.log.info(`Adding comment to document ${documentId} by user ${userId}`);

        // Validate document exists
        const document = await fastify.models.Document.findById(documentId);
        if (!document) {
          fastify.log.error(`Document not found: ${documentId}`);
          return reply.code(404).send({ message: "Document not found" });
        }

        // Add comment to document
        const updatedDocument = await fastify.models.Document.findByIdAndUpdate(
          documentId,
          {
            $push: {
              comments: {
                content,
                user: userId,
                createdAt: new Date(),
                replies: []
              }
            }
          },
          { new: true }
        ).populate('comments.user', 'userName')
         .populate('comments.replies.user', 'userName');

        if (!updatedDocument) {
          fastify.log.error(`Failed to update document: ${documentId}`);
          return reply.code(500).send({ message: "Failed to add comment" });
        }

        return updatedDocument;
      } catch (error) {
        fastify.log.error(`Error adding comment: ${error}`);
        if (error.name === 'ValidationError') {
          return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  });

  // Add a reply to a comment
  fastify.route({
    method: 'POST',
    url: `${routePrefix}/documents/:documentId/comments/:commentId/replies`,
    schema: {
      params: {
        type: 'object',
        required: ['documentId', 'commentId'],
        properties: {
          documentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          commentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        required: ['content', 'userId'],
        properties: {
          content: { type: 'string', minLength: 1 },
          userId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  user: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                  replies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        content: { type: 'string' },
                        user: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { documentId, commentId } = request.params;
        const { content, userId } = request.body;

        // Log incoming request data
        fastify.log.info(`Adding reply to comment ${commentId} in document ${documentId} by user ${userId}`);

        // Validate document exists
        const document = await fastify.models.Document.findById(documentId);
        if (!document) {
          fastify.log.error(`Document not found: ${documentId}`);
          return reply.code(404).send({ message: "Document not found" });
        }

        // Add reply to comment
        const updatedDocument = await fastify.models.Document.findOneAndUpdate(
          { 
            _id: documentId,
            'comments._id': commentId
          },
          {
            $push: {
              'comments.$.replies': {
                content,
                user: userId,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        ).populate('comments.user', 'userName')
         .populate('comments.replies.user', 'userName');

        if (!updatedDocument) {
          fastify.log.error(`Failed to update document: ${documentId}`);
          return reply.code(500).send({ message: "Failed to add reply" });
        }

        return updatedDocument;
      } catch (error) {
        fastify.log.error(`Error adding reply: ${error}`);
        if (error.name === 'ValidationError') {
          return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  });

  console.log('TMF Reference routes registered successfully');
});