import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { OpenAPIParser } from '../engine/openapi-parser';
import {
  createSpecSchema,
  specIdSchema,
  projectIdSchema,
  CreateSpecInput
} from '../schemas';
import { NotFoundError, BadRequestError } from '../errors';

export default async function specRoutes(fastify: FastifyInstance) {
  // Create a new spec for a project
  fastify.post<{ Params: { projectId: string }; Body: CreateSpecInput }>(
    '/projects/:projectId/specs',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const { type, sourceText } = createSpecSchema.parse(request.body);

      // Validate the spec
      try {
        if (type === 'OPENAPI') {
          OpenAPIParser.parse(sourceText);
        } else {
          JSON.parse(sourceText);
        }
      } catch (error) {
        throw new BadRequestError('Invalid spec format');
      }

      const spec = await prisma.mockSpec.create({
        data: {
          projectId,
          type,
          sourceText,
        },
      });

      return reply.status(201).send(spec);
    }
  );

  // Get all specs for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/specs',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      const specs = await prisma.mockSpec.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return specs;
    }
  );

  // Get a single spec
  fastify.get<{ Params: { id: string } }>('/specs/:id', async (request, reply) => {
    const { id } = specIdSchema.parse(request.params);

    const spec = await prisma.mockSpec.findUnique({
      where: { id },
    });

    if (!spec) {
      throw new NotFoundError('Spec');
    }

    return spec;
  });

  // Delete a spec
  fastify.delete<{ Params: { id: string } }>('/specs/:id', async (request, reply) => {
    const { id } = specIdSchema.parse(request.params);

    await prisma.mockSpec.delete({
      where: { id },
    });

    return { success: true };
  });
}
