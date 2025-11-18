import { FastifyInstance } from 'fastify';
import prisma from '../db';
import {
  createOverrideSchema,
  updateOverrideSchema,
  overrideIdSchema,
  projectIdSchema,
  CreateOverrideInput,
  UpdateOverrideInput
} from '../schemas';

export default async function overrideRoutes(fastify: FastifyInstance) {
  // Get all overrides for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/overrides',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      const overrides = await prisma.mockEndpointOverride.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return overrides;
    }
  );

  // Create a new override
  fastify.post<{ Params: { projectId: string }; Body: CreateOverrideInput }>(
    '/projects/:projectId/overrides',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const data = createOverrideSchema.parse(request.body);

      const override = await prisma.mockEndpointOverride.create({
        data: {
          projectId,
          method: data.method,
          path: data.path,
          customResponseJson: data.customResponseJson,
          enabled: data.enabled ?? true,
          statusCode: data.statusCode ?? 200,
        },
      });

      return reply.status(201).send(override);
    }
  );

  // Update an override
  fastify.put<{ Params: { id: string }; Body: UpdateOverrideInput }>(
    '/overrides/:id',
    async (request, reply) => {
      const { id } = overrideIdSchema.parse(request.params);
      const data = updateOverrideSchema.parse(request.body);

      const override = await prisma.mockEndpointOverride.update({
        where: { id },
        data,
      });

      return override;
    }
  );

  // Delete an override
  fastify.delete<{ Params: { id: string } }>('/overrides/:id', async (request, reply) => {
    const { id } = overrideIdSchema.parse(request.params);

    await prisma.mockEndpointOverride.delete({
      where: { id },
    });

    return { success: true };
  });
}
