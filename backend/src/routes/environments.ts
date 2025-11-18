import { FastifyInstance } from 'fastify';
import prisma from '../db';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  environmentIdSchema,
  CreateEnvironmentInput,
  UpdateEnvironmentInput
} from '../schemas/environment';
import { projectIdSchema } from '../schemas';
import { NotFoundError, BadRequestError } from '../errors';

export default async function environmentRoutes(fastify: FastifyInstance) {
  // List all environments for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/environments',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      const environments = await prisma.environment.findMany({
        where: { projectId },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        include: {
          _count: {
            select: {
              overrides: true,
              requestLogs: true,
            },
          },
        },
      });

      return environments;
    }
  );

  // Get a single environment
  fastify.get<{ Params: { id: string } }>(
    '/environments/:id',
    async (request, reply) => {
      const { id } = environmentIdSchema.parse(request.params);

      const environment = await prisma.environment.findUnique({
        where: { id },
        include: {
          overrides: true,
          _count: {
            select: {
              requestLogs: true,
            },
          },
        },
      });

      if (!environment) {
        throw new NotFoundError('Environment');
      }

      return environment;
    }
  );

  // Create a new environment
  fastify.post<{ Params: { projectId: string }; Body: CreateEnvironmentInput }>(
    '/projects/:projectId/environments',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const data = createEnvironmentSchema.parse(request.body);

      // Check if project exists
      const project = await prisma.mockProject.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundError('Project');
      }

      // Check if environment with same name already exists
      const existing = await prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: data.name,
          },
        },
      });

      if (existing) {
        throw new BadRequestError(`Environment '${data.name}' already exists for this project`);
      }

      // Create environment
      const environment = await prisma.environment.create({
        data: {
          projectId,
          ...data,
        },
      });

      return reply.status(201).send(environment);
    }
  );

  // Update an environment
  fastify.put<{ Params: { id: string }; Body: UpdateEnvironmentInput }>(
    '/environments/:id',
    async (request, reply) => {
      const { id } = environmentIdSchema.parse(request.params);
      const data = updateEnvironmentSchema.parse(request.body);

      // If setting this environment as active, deactivate others
      if (data.isActive === true) {
        const env = await prisma.environment.findUnique({ where: { id } });
        if (env) {
          await prisma.environment.updateMany({
            where: {
              projectId: env.projectId,
              id: { not: id },
            },
            data: { isActive: false },
          });
        }
      }

      const environment = await prisma.environment.update({
        where: { id },
        data,
      });

      return environment;
    }
  );

  // Delete an environment
  fastify.delete<{ Params: { id: string } }>(
    '/environments/:id',
    async (request, reply) => {
      const { id } = environmentIdSchema.parse(request.params);

      // Check if this is the active environment
      const environment = await prisma.environment.findUnique({
        where: { id },
      });

      if (environment?.isActive) {
        throw new BadRequestError('Cannot delete the active environment. Set another environment as active first.');
      }

      await prisma.environment.delete({
        where: { id },
      });

      return { success: true };
    }
  );

  // Activate an environment (shortcut endpoint)
  fastify.post<{ Params: { id: string } }>(
    '/environments/:id/activate',
    async (request, reply) => {
      const { id } = environmentIdSchema.parse(request.params);

      const env = await prisma.environment.findUnique({ where: { id } });
      if (!env) {
        throw new NotFoundError('Environment');
      }

      // Deactivate all other environments in this project
      await prisma.environment.updateMany({
        where: {
          projectId: env.projectId,
          id: { not: id },
        },
        data: { isActive: false },
      });

      // Activate this environment
      const environment = await prisma.environment.update({
        where: { id },
        data: { isActive: true },
      });

      return environment;
    }
  );

  // Clone an environment
  fastify.post<{ Params: { id: string }; Body: { name: string } }>(
    '/environments/:id/clone',
    async (request, reply) => {
      const { id } = environmentIdSchema.parse(request.params);
      const { name } = z.object({ name: z.string().min(1) }).parse(request.body);

      const sourceEnv = await prisma.environment.findUnique({
        where: { id },
        include: { overrides: true },
      });

      if (!sourceEnv) {
        throw new NotFoundError('Environment');
      }

      // Create new environment
      const newEnv = await prisma.environment.create({
        data: {
          projectId: sourceEnv.projectId,
          name,
          description: `Cloned from ${sourceEnv.name}`,
          baseUrl: sourceEnv.baseUrl,
          settings: sourceEnv.settings,
          isActive: false,
        },
      });

      // Clone all overrides
      if (sourceEnv.overrides.length > 0) {
        await prisma.mockEndpointOverride.createMany({
          data: sourceEnv.overrides.map((override) => ({
            projectId: sourceEnv.projectId,
            environmentId: newEnv.id,
            method: override.method,
            path: override.path,
            customResponseJson: override.customResponseJson,
            customHeaders: override.customHeaders,
            delayMs: override.delayMs,
            enabled: override.enabled,
            statusCode: override.statusCode,
            conditionalLogic: override.conditionalLogic,
          })),
        });
      }

      const result = await prisma.environment.findUnique({
        where: { id: newEnv.id },
        include: {
          overrides: true,
          _count: {
            select: {
              requestLogs: true,
            },
          },
        },
      });

      return reply.status(201).send(result);
    }
  );
}
