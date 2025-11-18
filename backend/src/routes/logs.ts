import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { projectIdSchema, logsQuerySchema, LogsQueryInput } from '../schemas';

export default async function logRoutes(fastify: FastifyInstance) {
  // Get all logs for a project
  fastify.get<{ Params: { projectId: string }; Querystring: LogsQueryInput }>(
    '/projects/:projectId/logs',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const { limit, offset } = logsQuerySchema.parse(request.query);

      const logs = await prisma.requestLog.findMany({
        where: { projectId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.requestLog.count({
        where: { projectId },
      });

      return {
        logs,
        total,
        limit,
        offset,
      };
    }
  );

  // Delete all logs for a project
  fastify.delete<{ Params: { projectId: string } }>(
    '/projects/:projectId/logs',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      await prisma.requestLog.deleteMany({
        where: { projectId },
      });

      return { success: true };
    }
  );
}
