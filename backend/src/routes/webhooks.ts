import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { z } from 'zod';
import { projectIdSchema } from '../schemas';
import { NotFoundError } from '../errors';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  pathPattern: z.string().optional(),
  statusCodes: z.array(z.number().int()).optional(),
  secret: z.string().optional(),
  headers: z.string().optional(), // JSON
  enabled: z.boolean().optional().default(true),
  retryAttempts: z.number().int().min(0).max(10).optional().default(3),
});

export default async function webhookRoutes(fastify: FastifyInstance) {
  // List webhooks for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/webhooks',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);

      const webhooks = await prisma.webhook.findMany({
        where: { projectId },
        include: {
          _count: {
            select: { deliveries: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return webhooks;
    }
  );

  // Get webhook by ID
  fastify.get<{ Params: { id: string } }>('/webhooks/:id', async (request, reply) => {
    const { id } = request.params;

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        deliveries: {
          take: 20,
          orderBy: { deliveredAt: 'desc' },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook');
    }

    return webhook;
  });

  // Create webhook
  fastify.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/webhooks',
    async (request, reply) => {
      const { projectId } = projectIdSchema.parse(request.params);
      const data = createWebhookSchema.parse(request.body);

      const webhook = await prisma.webhook.create({
        data: {
          projectId,
          ...data,
        },
      });

      return reply.status(201).send(webhook);
    }
  );

  // Update webhook
  fastify.put<{ Params: { id: string } }>('/webhooks/:id', async (request, reply) => {
    const { id } = request.params;
    const data = createWebhookSchema.partial().parse(request.body);

    const webhook = await prisma.webhook.update({
      where: { id },
      data,
    });

    return webhook;
  });

  // Delete webhook
  fastify.delete<{ Params: { id: string } }>('/webhooks/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.webhook.delete({
      where: { id },
    });

    return { success: true };
  });

  // Test webhook (send test payload)
  fastify.post<{ Params: { id: string } }>('/webhooks/:id/test', async (request, reply) => {
    const { id } = request.params;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      throw new NotFoundError('Webhook');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
      },
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret }),
          ...(webhook.headers && JSON.parse(webhook.headers)),
        },
        body: JSON.stringify(testPayload),
      });

      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          eventType: 'webhook.test',
          payload: JSON.stringify(testPayload),
          statusCode: response.status,
          responseBody: await response.text(),
          status: response.ok ? 'SUCCESS' : 'FAILED',
        },
      });

      return { success: response.ok, statusCode: response.status };
    } catch (error: any) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          eventType: 'webhook.test',
          payload: JSON.stringify(testPayload),
          error: error.message,
          status: 'FAILED',
        },
      });

      return { success: false, error: error.message };
    }
  });
}
