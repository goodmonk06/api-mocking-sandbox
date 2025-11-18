import { z } from 'zod';

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export const projectIdSchema = z.object({
  id: z.string().cuid(),
});

// Spec schemas
export const createSpecSchema = z.object({
  type: z.enum(['OPENAPI', 'JSON_SCHEMA']),
  sourceText: z.string().min(1, 'Source text is required'),
});

export const specIdSchema = z.object({
  id: z.string().cuid(),
});

// Override schemas
export const createOverrideSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
  path: z.string().min(1, 'Path is required').regex(/^\//, 'Path must start with /'),
  customResponseJson: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ),
  enabled: z.boolean().optional().default(true),
  statusCode: z.number().int().min(100).max(599).optional().default(200),
});

export const updateOverrideSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).optional(),
  path: z.string().min(1).regex(/^\//).optional(),
  customResponseJson: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ).optional(),
  enabled: z.boolean().optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
});

export const overrideIdSchema = z.object({
  id: z.string().cuid(),
});

// Log schemas
export const logsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateSpecInput = z.infer<typeof createSpecSchema>;
export type CreateOverrideInput = z.infer<typeof createOverrideSchema>;
export type UpdateOverrideInput = z.infer<typeof updateOverrideSchema>;
export type LogsQueryInput = z.infer<typeof logsQuerySchema>;
