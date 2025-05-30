const zoneSchema = {
  type: 'object',
  properties: {
    zoneNumber: { type: 'number' },
    zoneName: { type: 'string' },
    isActive: { type: 'boolean' }
  }
};
  
const idParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
  }
};



module.exports = { zoneSchema, idParamSchema };