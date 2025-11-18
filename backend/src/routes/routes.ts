import { FastifyInstance } from 'fastify';
import { MockEngine } from '../engine/mock-engine';

export default async function routesRoutes(fastify: FastifyInstance) {
  // Get all derived routes for a project
  fastify.get('/projects/:projectId/routes', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const routes = await MockEngine.getProjectRoutes(projectId);

    return routes;
  });
}
