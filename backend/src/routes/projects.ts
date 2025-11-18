import { FastifyInstance } from 'fastify';
import prisma from '../db';

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
  fastify.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await prisma.mockProject.findUnique({
      where: { id },
      include: {
        specs: true,
        endpointOverrides: true,
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return project;
  });

  // Create a new project
  fastify.post('/projects', async (request, reply) => {
    const { name, description } = request.body as { name: string; description?: string };

    if (!name) {
      return reply.status(400).send({ error: 'Name is required' });
    }

    const project = await prisma.mockProject.create({
      data: { name, description },
    });

    return reply.status(201).send(project);
  });

  // Update a project
  fastify.put('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, description } = request.body as { name?: string; description?: string };

    const project = await prisma.mockProject.update({
      where: { id },
      data: { name, description },
    });

    return project;
  });

  // Delete a project
  fastify.delete('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.mockProject.delete({
      where: { id },
    });

    return { success: true };
  });
}
