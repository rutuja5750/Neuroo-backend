const getSectionsByZoneId = async (request, reply) => {
    try {
      const sections = await request.server.models.Section.find({ 
        zone: request.params.zoneId 
        }).populate('zone', 'zoneName zoneNumber');
          
        return sections;
    } catch (error) {
      fastify.log.error('Failed to retrieve sections:', error);
        return reply.code(500).send({ error: 'Failed to retrieve sections' });
    }  
};

const getSectionById = async (request, reply) => {
    try {
        const section = await request.server.models.Section.findById(request.params.id)
            .populate('zone', 'zoneName zoneNumber');
          
        if (!section) {
            return reply.code(404).send({ error: 'Section not found' });
        }  
        return section;
    } catch (error) {
        fastify.log.error('Failed to retrieve section:', error);
        return reply.code(500).send({ error: 'Failed to retrieve section' });
    }
      
};

const createSection = async (request, reply) => {
    try {
        // Verify zone exists first
        const zoneExists = await request.server.models.Zone.exists({ _id: request.params.zoneId });
        
        if (!zoneExists) {
          return reply.code(404).send({ error: 'Zone not found' });
        }
        
        const newSection = await request.server.models.Section.create({
          ...request.body,
          zone: request.params.zoneId
        });
        
        // Populate zone information
        const populatedSection = await request.server.models.Section.findById(newSection._id)
          .populate('zone', 'zoneName zoneNumber');
        
        return reply.code(201).send(populatedSection);
      } catch (error) {
        fastify.log.error('Failed to create section:', error);
        
        // Handle duplicate key error specifically
        if (error.code === 11000) {
          return reply.code(400).send({ 
            error: 'Section number already exists in this zone',
            details: 'The section number must be unique within a zone'
          });
        }
        
        return reply.code(400).send({ 
          error: 'Failed to create section', 
          details: error.message 
        });
    }
};

module.exports = {
    getSectionsByZoneId,
    getSectionById,
    createSection
};
