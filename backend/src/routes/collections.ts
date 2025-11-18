import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { z } from 'zod';
import { projectIdSchema } from '../schemas';
import { NotFoundError } from '../errors';

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  pathPattern: z.string().optional(),
  endpoints: z.string(), // JSON array
  tags: z.array(z.string()).optional(),
  settings: z.string().optional(),
});

export default async function collectionRoutes(fastify: FastifyInstance) {
  // List collections for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/collections',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      const collections = await prisma.collection.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return collections;
    }
  );

  // Get collection by ID
  fastify.get<{ Params: { id: string } }>('/collections/:id', async (request, reply) => {
    const { id } = request.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundError('Collection');
    }

    return collection;
  });

  // Create collection
  fastify.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/collections',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const data = createCollectionSchema.parse(request.body);

      const collection = await prisma.collection.create({
        data: {
          projectId,
          ...data,
        },
      });

      return reply.status(201).send(collection);
    }
  );

  // Update collection
  fastify.put<{ Params: { id: string } }>('/collections/:id', async (request, reply) => {
    const { id } = request.params;
    const data = createCollectionSchema.partial().parse(request.body);

    const collection = await prisma.collection.update({
      where: { id },
      data,
    });

    return collection;
  });

  // Delete collection
  fastify.delete<{ Params: { id: string } }>('/collections/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.collection.delete({
      where: { id },
    });

    return { success: true };
  });
}
