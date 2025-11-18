import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MockEngine } from '../engine/mock-engine';
import prisma from '../db';

export default async function mockServerRoutes(fastify: FastifyInstance) {
  // Wildcard route to handle all mock requests
  fastify.all('/mock/:projectId/*', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const wildcardPath = (request.params as any)['*'];
    const path = '/' + wildcardPath;
    const method = request.method;

    // Get mock response
    const mockResponse = await MockEngine.getMockResponse({
      projectId,
      method,
      path,
      body: request.body,
      headers: request.headers as Record<string, string>,
    });

    // Log the request
    await prisma.requestLog.create({
      data: {
        projectId,
        method,
        path,
        statusCode: mockResponse.statusCode,
        bodyJson: request.body ? JSON.stringify(request.body) : null,
        headers: JSON.stringify(request.headers),
        responseJson: JSON.stringify(mockResponse.data),
      },
    });

    return reply.status(mockResponse.statusCode).send(mockResponse.data);
  });

  // Also handle the base /mock/:projectId path (no wildcard)
  fastify.all('/mock/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const path = '/';
    const method = request.method;

    const mockResponse = await MockEngine.getMockResponse({
      projectId,
      method,
      path,
      body: request.body,
      headers: request.headers as Record<string, string>,
    });

    await prisma.requestLog.create({
      data: {
        projectId,
        method,
        path,
        statusCode: mockResponse.statusCode,
        bodyJson: request.body ? JSON.stringify(request.body) : null,
        headers: JSON.stringify(request.headers),
        responseJson: JSON.stringify(mockResponse.data),
      },
    });

    return reply.status(mockResponse.statusCode).send(mockResponse.data);
  });
}
