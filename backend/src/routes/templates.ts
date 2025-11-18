import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { z } from 'zod';
import { NotFoundError } from '../errors';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1),
  type: z.enum(['OPENAPI', 'JSON_SCHEMA']),
  sourceText: z.string().min(1),
  variables: z.string(), // JSON string
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(true),
});

export default async function templateRoutes(fastify: FastifyInstance) {
  // List templates
  fastify.get('/templates', async (request, reply) => {
    const { category, isPublic } = request.query as { category?: string; isPublic?: string };

    const templates = await prisma.template.findMany({
      where: {
        ...(category && { category }),
        ...(isPublic !== undefined && { isPublic: isPublic === 'true' }),
      },
      orderBy: { usageCount: 'desc' },
    });

    return templates;
  });

  // Get template by ID
  fastify.get<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template');
    }

    return template;
  });

  // Create template
  fastify.post('/templates', async (request, reply) => {
    const data = createTemplateSchema.parse(request.body);

    const template = await prisma.template.create({
      data,
    });

    return reply.status(201).send(template);
  });

  // Apply template to create project
  fastify.post<{ Params: { id: string } }>(
    '/templates/:id/apply',
    async (request, reply) => {
      const { id } = request.params;
      const { projectName, variableValues } = z.object({
        projectName: z.string(),
        variableValues: z.record(z.any()),
      }).parse(request.body);

      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) {
        throw new NotFoundError('Template');
      }

      // Substitute variables in sourceText
      let processedSpec = template.sourceText;
      Object.entries(variableValues).forEach(([key, value]) => {
        processedSpec = processedSpec.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

      // Create project with processed spec
      const project = await prisma.mockProject.create({
        data: {
          name: projectName,
          description: `Created from template: ${template.name}`,
        },
      });

      await prisma.mockSpec.create({
        data: {
          projectId: project.id,
          type: template.type,
          sourceText: processedSpec,
        },
      });

      // Increment usage count
      await prisma.template.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });

      return reply.status(201).send(project);
    }
  );

  // Delete template
  fastify.delete<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.template.delete({
      where: { id },
    });

    return { success: true };
  });
}
