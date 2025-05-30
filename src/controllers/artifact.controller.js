const getArtifactsBySectionId = async (request, reply) => {
    try {
        const artifacts = await request.server.models.Artifact.find({ section: request.params.sectionId });
        reply.send(artifacts);
    } catch (error) {
        fastify.log.error('Failed to retrieve artifacts:', error);
        reply.status(500).send({ error: 'Failed to retrieve artifacts' });
    }
};

const getArtifactById = async (request, reply) => {
    try {
        const artifact = await request.server.models.Artifact.findById(request.params.id);
        
        if (!artifact) {
          return reply.status(404).send({ error: 'Artifact not found' });
        }
        
        reply.send(artifact);
    } catch (error) {
        fastify.log.error('Failed to retrieve artifact:', error);
        reply.status(500).send({ error: 'Failed to retrieve artifact' });
    }  
};

const createArtifact = async (request, reply) => {
    try {
        const newArtifact = await request.server.models.Artifact.create({
          ...request.body,
          section: request.params.sectionId
        });
        reply.status(201).send(newArtifact);
    } catch (error) {
        fastify.log.error('Failed to create artifact:', error);
        reply.status(400).send({ error: 'Failed to create artifact', details: error.message });
      
    }
};

module.exports = {
    getArtifactsBySectionId,
    getArtifactById,
    createArtifact
};
