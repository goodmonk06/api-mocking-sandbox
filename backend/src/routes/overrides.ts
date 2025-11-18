import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function overrideRoutes(fastify: FastifyInstance) {
  // Get all overrides for a project
  fastify.get('/projects/:projectId/overrides', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const overrides = await prisma.mockEndpointOverride.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return overrides;
  });

  // Create a new override
  fastify.post('/projects/:projectId/overrides', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { method, path, customResponseJson, enabled, statusCode } = request.body as {
      method: string;
      path: string;
      customResponseJson: string;
      enabled?: boolean;
      statusCode?: number;
    };

    if (!method || !path || !customResponseJson) {
      return reply.status(400).send({ error: 'method, path, and customResponseJson are required' });
    }

    // Validate JSON
    try {
      JSON.parse(customResponseJson);
    } catch {
      return reply.status(400).send({ error: 'customResponseJson must be valid JSON' });
    }

    const override = await prisma.mockEndpointOverride.create({
      data: {
        projectId,
        method: method.toUpperCase(),
        path,
        customResponseJson,
        enabled: enabled ?? true,
        statusCode: statusCode ?? 200,
      },
    });

    return reply.status(201).send(override);
  });

  // Update an override
  fastify.put('/overrides/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { method, path, customResponseJson, enabled, statusCode } = request.body as {
      method?: string;
      path?: string;
      customResponseJson?: string;
      enabled?: boolean;
      statusCode?: number;
    };

    const data: any = {};
    if (method) data.method = method.toUpperCase();
    if (path) data.path = path;
    if (customResponseJson) {
      try {
        JSON.parse(customResponseJson);
        data.customResponseJson = customResponseJson;
      } catch {
        return reply.status(400).send({ error: 'customResponseJson must be valid JSON' });
      }
    }
    if (enabled !== undefined) data.enabled = enabled;
    if (statusCode !== undefined) data.statusCode = statusCode;

    const override = await prisma.mockEndpointOverride.update({
      where: { id },
      data,
    });

    return override;
  });

  // Delete an override
  fastify.delete('/overrides/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.mockEndpointOverride.delete({
      where: { id },
    });

    return { success: true };
  });
}
