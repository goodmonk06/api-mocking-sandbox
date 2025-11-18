import { z } from 'zod';

export const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-_]+$/, 'Name must contain only letters, numbers, hyphens and underscores'),
  description: z.string().optional(),
  baseUrl: z.string().url().optional(),
  settings: z.string().optional(), // JSON string
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-_]+$/).optional(),
  description: z.string().optional(),
  baseUrl: z.string().url().optional(),
  settings: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const environmentIdSchema = z.object({
  id: z.string().cuid(),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
