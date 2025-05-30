  // Define schemas for validation
const documentSchema = {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      documentTitle: { type: 'string' },
      zone: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          zoneName: { type: 'string' },
          zoneNumber: { type: 'number' },
          isActive: { type: 'boolean' }
        }
      },
      section: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sectionName: { type: 'string' },
          sectionNumber: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      artifact: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          artifactName: { type: 'string' },
          artifactNumber: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      subArtifact: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          subArtifactName: { type: 'string' },
          subArtifactNumber: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      },
      version: { type: 'string' },
      documentDate: { type: 'string', format: 'date-time' },
      expirationDate: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['Draft', 'In Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn', 'Archived'] },
      fileLocation: { type: 'string' },
      fileFormat: { type: 'string' },
      fileSize: { type: 'number' },
      fileUrl: { type: 'string' },
      fileName: { type: 'string' },
      study: { type: 'string' },
      site: { type: 'string' },
      country: { type: 'string' },
      accessLevel: { type: 'string', enum: ['Public', 'Restricted', 'Confidential'] },
      isActive: { type: 'boolean' },
      createdBy: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userName: { type: 'string' }
        }
      },
      lastModifiedBy: { 
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userName: { type: 'string' }
        }
      },
      indication: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
};
  
const idParamSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
    }
};
  
const userIdParamSchema = {
    type: 'object',
    properties: {
      userId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
    }
};

module.exports = { documentSchema, idParamSchema, userIdParamSchema };

