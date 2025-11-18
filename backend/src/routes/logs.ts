import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function logRoutes(fastify: FastifyInstance) {
  // Get all logs for a project
  fastify.get('/projects/:projectId/logs', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };

    const logs = await prisma.requestLog.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.requestLog.count({
      where: { projectId },
    });

    return {
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset),
    };
  });

  // Delete all logs for a project
  fastify.delete('/projects/:projectId/logs', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    await prisma.requestLog.deleteMany({
      where: { projectId },
    });

    return { success: true };
  });
}
