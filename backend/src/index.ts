import Fastify from 'fastify';
import cors from '@fastify/cors';
import projectRoutes from './routes/projects';
import specRoutes from './routes/specs';
import overrideRoutes from './routes/overrides';
import logRoutes from './routes/logs';
import routesRoutes from './routes/routes';
import mockServerRoutes from './routes/mock-server';
import { errorHandler } from './errors';

const fastify = Fastify({
  logger: true,
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register CORS
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register API routes
    await fastify.register(projectRoutes, { prefix: '/api' });
    await fastify.register(specRoutes, { prefix: '/api' });
    await fastify.register(overrideRoutes, { prefix: '/api' });
    await fastify.register(logRoutes, { prefix: '/api' });
    await fastify.register(routesRoutes, { prefix: '/api' });

    // Register mock server routes (no /api prefix)
    await fastify.register(mockServerRoutes);

    // Start the server
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server is running at http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
