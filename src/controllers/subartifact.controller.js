const getSubArtifactsByArtifactId = async (request, reply) => {
    try {
        const subartifacts = await request.server.models.SubArtifact.find({ artifact: request.params.artifactId });
        reply.send(subartifacts);
    } catch (error) {
        fastify.log.error('Failed to retrieve subartifacts:', error);
        reply.status(500).send({ error: 'Failed to retrieve subartifacts' });
    }
};

const getSubArtifactById = async (request, reply) => {
    try {
        const subartifact = await request.server.models.SubArtifact.findById(request.params.id);
        
        if (!subartifact) {
          return reply.status(404).send({ error: 'Subartifact not found' });
        }
        
        reply.send(subartifact);
    } catch (error) {
        fastify.log.error('Failed to retrieve subartifact:', error);
        reply.status(500).send({ error: 'Failed to retrieve subartifact' });
    }
};

const createSubArtifact = async (request, reply) => {
    try {
        const newSubArtifact = await request.server.models.SubArtifact.create({
          ...request.body,
          artifact: request.params.artifactId
        });
        reply.status(201).send(newSubArtifact);
    } catch (error) {
        fastify.log.error('Failed to create subartifact:', error);
        reply.status(400).send({ error: 'Failed to create subartifact', details: error.message });
    }
};

module.exports = {
    getSubArtifactsByArtifactId,
    getSubArtifactById,
    createSubArtifact
};
