import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message, 'BAD_REQUEST');
  }
}

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Custom app errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // Fastify errors
  if ('statusCode' in error && error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code || 'ERROR',
    });
  }

  // Unknown errors
  request.log.error(error);
  return reply.status(500).send({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
}
