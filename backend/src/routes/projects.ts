import { FastifyInstance } from 'fastify';
import prisma from '../db';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  CreateProjectInput,
  UpdateProjectInput
} from '../schemas';
import { NotFoundError } from '../errors';

export default async function projectRoutes(fastify: FastifyInstance) {
  // List all projects
  fastify.get('/projects', async (request, reply) => {
    const projects = await prisma.mockProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        specs: true,
        _count: {
          select: {
            endpointOverrides: true,
            requestLogs: true,
          },
        },
      },
    });
    return projects;
  });

  // Get a single project
  fastify.get<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = projectIdSchema.parse(request.params);

    const project = await prisma.mockProject.findUnique({
      where: { id },
      include: {
        specs: true,
        endpointOverrides: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  });

  // Create a new project
  fastify.post<{ Body: CreateProjectInput }>('/projects', async (request, reply) => {
    const data = createProjectSchema.parse(request.body);

    const project = await prisma.mockProject.create({
      data,
    });

    return reply.status(201).send(project);
  });

  // Update a project
  fastify.put<{ Params: { id: string }; Body: UpdateProjectInput }>(
    '/projects/:id',
    async (request, reply) => {
      const { id } = projectIdSchema.parse(request.params);
      const data = updateProjectSchema.parse(request.body);

      const project = await prisma.mockProject.update({
        where: { id },
        data,
      });

      return project;
    }
  );

  // Delete a project
  fastify.delete<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = projectIdSchema.parse(request.params);

    await prisma.mockProject.delete({
      where: { id },
    });

    return { success: true };
  });
}
