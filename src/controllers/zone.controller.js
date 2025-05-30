const getZones = async (request, reply) => {
    try {
        const zones = await request.server.models.Zone.find();
        return zones;
    } catch (error) {
        request.server.log.error('Failed to retrieve zones:', error);
        return reply.code(500).send({ error: 'Failed to retrieve zones' });
    }   
};

const getZoneById = async (request, reply) => {
    try {
        const zone = await request.server.models.Zone.findById(request.params.id);
        
        if (!zone) {
            return reply.code(404).send({ error: 'Zone not found' });
        }
        
        return zone;
    } catch (error) {
        request.server.log.error('Failed to retrieve zone:', error);
        return reply.code(500).send({ error: 'Failed to retrieve zone' });
    }
};

const createZone = async (request, reply) => {
    try {
        const newZone = await request.server.models.Zone.create(request.body);
        return reply.code(201).send(newZone);
    } catch (error) {
        request.server.log.error('Failed to create zone:', error);
        return reply.code(400).send({ 
            error: 'Failed to create zone', 
            details: error.message 
        });
    }
};

module.exports = {
    getZones,
    getZoneById,
    createZone
};
