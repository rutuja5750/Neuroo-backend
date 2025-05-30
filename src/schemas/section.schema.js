
// Define schemas for validation
const sectionSchema = {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      sectionNumber: { type: 'string' },
      sectionName: { type: 'string' },
      zone: { type: 'string' },
      isRequired: { type: 'boolean' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
};
  
const sectionInputSchema = {
    type: 'object',
    required: ['sectionNumber', 'sectionName'],
    properties: {
      sectionNumber: { type: 'string' },
      sectionName: { type: 'string' },
      isRequired: { type: 'boolean' },
      isActive: { type: 'boolean' }
    }
};

  
const zoneIdParamSchema = {
    type: 'object',
    properties: {
      zoneId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
    }
};




module.exports = { 
    sectionSchema, 
    sectionInputSchema, 
    zoneIdParamSchema 
};
  