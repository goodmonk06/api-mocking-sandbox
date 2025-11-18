import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { OpenAPIParser } from '../engine/openapi-parser';

export default async function specRoutes(fastify: FastifyInstance) {
  // Create a new spec for a project
  fastify.post('/projects/:projectId/specs', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { type, sourceText } = request.body as { type: 'OPENAPI' | 'JSON_SCHEMA'; sourceText: string };

    if (!type || !sourceText) {
      return reply.status(400).send({ error: 'type and sourceText are required' });
    }

    // Validate the spec
    try {
      if (type === 'OPENAPI') {
        OpenAPIParser.parse(sourceText);
      } else {
        JSON.parse(sourceText);
      }
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid spec format' });
    }

    const spec = await prisma.mockSpec.create({
      data: {
        projectId,
        type,
        sourceText,
      },
    });

    return reply.status(201).send(spec);
  });

  // Get all specs for a project
  fastify.get('/projects/:projectId/specs', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const specs = await prisma.mockSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return specs;
  });

  // Get a single spec
  fastify.get('/specs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const spec = await prisma.mockSpec.findUnique({
      where: { id },
    });

    if (!spec) {
      return reply.status(404).send({ error: 'Spec not found' });
    }

    return spec;
  });

  // Delete a spec
  fastify.delete('/specs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.mockSpec.delete({
      where: { id },
    });

    return { success: true };
  });
}
