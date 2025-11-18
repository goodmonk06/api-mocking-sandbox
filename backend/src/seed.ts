import prisma from './db';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🌱 Starting Phase 3 comprehensive seed...\n');

  // Clean up in correct order (respect foreign keys)
  await prisma.requestLog.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.responseScenario.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.mockEndpointOverride.deleteMany();
  await prisma.mockSpec.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.mockProject.deleteMany();
  await prisma.template.deleteMany();
  await prisma.metric.deleteMany();

  console.log('✓ Cleaned up existing data\n');

  // ========== TEMPLATES ==========
  console.log('Creating templates...');

  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: 'Basic CRUD API',
        description: 'Standard CRUD operations for a resource',
        category: 'CRUD',
        type: 'OPENAPI',
        tags: ['crud', 'rest', 'basic'],
        sourceText: `openapi: 3.0.0
info:
  title: {{resourceName}} API
  version: 1.0.0
paths:
  /{{resourcePath}}:
    get:
      summary: List all {{resourceName}}
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object`,
        variables: JSON.stringify({
          resourceName: { type: 'string', description: 'Name of the resource (plural)' },
          resourcePath: { type: 'string', description: 'API path for the resource' },
        }),
        usageCount: 5,
      },
    }),
    prisma.template.create({
      data: {
        name: 'Pagination API',
        description: 'API with pagination support',
        category: 'Pagination',
        type: 'OPENAPI',
        tags: ['pagination', 'rest'],
        sourceText: `openapi: 3.0.0
info:
  title: Paginated {{resourceName}} API
  version: 1.0.0
paths:
  /{{resourcePath}}:
    get:
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Paginated results`,
        variables: JSON.stringify({
          resourceName: { type: 'string' },
          resourcePath: { type: 'string' },
        }),
        usageCount: 3,
      },
    }),
  ]);

  console.log(`✓ Created ${templates.length} templates\n`);

  // ========== MAIN PROJECT ==========
  console.log('Creating demo projects...');

  const ecomProject = await prisma.mockProject.create({
    data: {
      name: 'E-commerce API Demo',
      description: 'Full-featured e-commerce API with multiple environments',
      tags: ['ecommerce', 'demo', 'production-ready'],
      visibility: 'PUBLIC',
    },
  });

  const socialProject = await prisma.mockProject.create({
    data: {
      name: 'Social Media API',
      description: 'Social networking platform API',
      tags: ['social', 'demo'],
      visibility: 'PRIVATE',
    },
  });

  console.log(`✓ Created ${2} projects\n`);

  // ========== ENVIRONMENTS ==========
  console.log('Creating environments...');

  const prodEnv = await prisma.environment.create({
    data: {
      projectId: ecomProject.id,
      name: 'production',
      description: 'Production environment',
      isActive: true,
      baseUrl: 'https://api.example.com',
      settings: JSON.stringify({ rateLimitPerMin: 1000, enableCaching: true }),
    },
  });

  const stagingEnv = await prisma.environment.create({
    data: {
      projectId: ecomProject.id,
      name: 'staging',
      description: 'Staging environment for testing',
      isActive: false,
      baseUrl: 'https://staging-api.example.com',
      settings: JSON.stringify({ rateLimitPerMin: 500, enableCaching: false }),
    },
  });

  const devEnv = await prisma.environment.create({
    data: {
      projectId: ecomProject.id,
      name: 'development',
      description: 'Development environment',
      isActive: false,
      baseUrl: 'http://localhost:3000',
      settings: JSON.stringify({ rateLimitPerMin: 100, enableCaching: false }),
    },
  });

  console.log(`✓ Created ${3} environments\n`);

  // ========== SPECS ==========
  console.log('Loading OpenAPI specs...');

  const sampleSpecPath = path.join(__dirname, '../../examples/sample-openapi.yaml');
  const sampleSpec = fs.readFileSync(sampleSpecPath, 'utf-8');

  await prisma.mockSpec.create({
    data: {
      projectId: ecomProject.id,
      type: 'OPENAPI',
      sourceText: sampleSpec,
      version: '1.0.0',
      isValid: true,
    },
  });

  console.log('✓ Loaded OpenAPI specs\n');

  // ========== OVERRIDES ==========
  console.log('Creating endpoint overrides...');

  const overrides = [
    {
      projectId: ecomProject.id,
      environmentId: prodEnv.id,
      method: 'GET',
      path: '/products/special-deal',
      statusCode: 200,
      enabled: true,
      delayMs: 100,
      customResponseJson: JSON.stringify({
        id: 'prod_special',
        name: 'Black Friday Special',
        price: 49.99,
        discount: '50%',
      }),
    },
    {
      projectId: ecomProject.id,
      environmentId: stagingEnv.id,
      method: 'GET',
      path: '/products/special-deal',
      statusCode: 200,
      enabled: true,
      delayMs: 500,
      customResponseJson: JSON.stringify({
        id: 'prod_special_staging',
        name: 'Staging Special Deal',
        price: 39.99,
      }),
    },
    {
      projectId: ecomProject.id,
      environmentId: null, // Global override
      method: 'GET',
      path: '/users/me',
      statusCode: 200,
      enabled: true,
      customResponseJson: JSON.stringify({
        id: 'user_demo',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'customer',
      }),
    },
  ];

  for (const override of overrides) {
    await prisma.mockEndpointOverride.create({ data: override });
  }

  console.log(`✓ Created ${overrides.length} overrides\n`);

  // ========== COLLECTIONS ==========
  console.log('Creating collections...');

  await prisma.collection.create({
    data: {
      projectId: ecomProject.id,
      name: 'Product Management',
      description: 'All product-related endpoints',
      pathPattern: '^/products',
      tags: ['products', 'catalog'],
      endpoints: JSON.stringify([
        { method: 'GET', path: '/products' },
        { method: 'POST', path: '/products' },
        { method: 'GET', path: '/products/{id}' },
        { method: 'PUT', path: '/products/{id}' },
        { method: 'DELETE', path: '/products/{id}' },
      ]),
    },
  });

  await prisma.collection.create({
    data: {
      projectId: ecomProject.id,
      name: 'Order Processing',
      description: 'Order lifecycle endpoints',
      pathPattern: '^/orders',
      tags: ['orders', 'transactions'],
      endpoints: JSON.stringify([
        { method: 'GET', path: '/orders' },
        { method: 'POST', path: '/orders' },
        { method: 'GET', path: '/orders/{id}' },
      ]),
    },
  });

  console.log('✓ Created 2 collections\n');

  // ========== WEBHOOKS ==========
  console.log('Creating webhooks...');

  const webhook = await prisma.webhook.create({
    data: {
      projectId: ecomProject.id,
      name: 'Order Created Notification',
      url: 'https://webhook.site/unique-id',
      events: ['mock.request', 'order.created'],
      pathPattern: '^/orders',
      statusCodes: [200, 201],
      enabled: true,
      retryAttempts: 3,
    },
  });

  // Create sample webhook deliveries
  await prisma.webhookDelivery.createMany({
    data: [
      {
        webhookId: webhook.id,
        eventType: 'order.created',
        payload: JSON.stringify({ orderId: 'order_123' }),
        statusCode: 200,
        status: 'SUCCESS',
      },
      {
        webhookId: webhook.id,
        eventType: 'order.created',
        payload: JSON.stringify({ orderId: 'order_124' }),
        statusCode: 500,
        status: 'FAILED',
        error: 'Internal Server Error',
      },
    ],
  });

  console.log('✓ Created webhooks and deliveries\n');

  // ========== RESPONSE SCENARIOS ==========
  console.log('Creating response scenarios...');

  await prisma.responseScenario.create({
    data: {
      projectId: ecomProject.id,
      name: 'A/B Test Product Response',
      description: 'Test two different product response formats',
      method: 'GET',
      path: '/products/{id}',
      enabled: true,
      selectionStrategy: 'WEIGHTED',
      scenarios: JSON.stringify([
        {
          name: 'Variant A - Detailed',
          weight: 0.5,
          response: { id: 'prod_123', name: 'Product', price: 99.99, details: 'Full details' },
        },
        {
          name: 'Variant B - Minimal',
          weight: 0.5,
          response: { id: 'prod_123', name: 'Product', price: 99.99 },
        },
      ]),
    },
  });

  console.log('✓ Created response scenarios\n');

  // ========== REQUEST LOGS ==========
  console.log('Creating sample request logs...');

  const logs = [
    {
      projectId: ecomProject.id,
      environmentId: prodEnv.id,
      method: 'GET',
      path: '/products',
      statusCode: 200,
      durationMs: 45,
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.100',
      responseSize: 1024,
      headers: JSON.stringify({ 'user-agent': 'Demo Client' }),
      responseJson: JSON.stringify([{ id: 'prod_1' }]),
    },
    {
      projectId: ecomProject.id,
      environmentId: prodEnv.id,
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      durationMs: 120,
      userAgent: 'PostmanRuntime/7.26.8',
      ipAddress: '192.168.1.101',
      responseSize: 512,
      bodyJson: JSON.stringify({ userId: 'user_123' }),
      headers: JSON.stringify({ 'content-type': 'application/json' }),
      responseJson: JSON.stringify({ id: 'order_1', status: 'created' }),
    },
  ];

  for (const log of logs) {
    await prisma.requestLog.create({ data: log });
  }

  console.log(`✓ Created ${logs.length} request logs\n`);

  // ========== METRICS ==========
  console.log('Creating sample metrics...');

  await prisma.metric.createMany({
    data: [
      {
        projectId: ecomProject.id,
        name: 'mock.request.count',
        value: 150,
        labels: JSON.stringify({ environment: 'production', method: 'GET' }),
      },
      {
        projectId: ecomProject.id,
        name: 'mock.request.duration_ms',
        value: 45.5,
        labels: JSON.stringify({ environment: 'production', path: '/products' }),
      },
    ],
  });

  console.log('✓ Created metrics\n');

  // ========== SUMMARY ==========
  console.log('━'.repeat(60));
  console.log('✅ Phase 3 Seed Completed Successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${templates.length} Templates`);
  console.log(`   • 2 Projects`);
  console.log(`   • 3 Environments`);
  console.log(`   • ${overrides.length} Endpoint Overrides`);
  console.log(`   • 2 Collections`);
  console.log(`   • 1 Webhook`);
  console.log(`   • 1 Response Scenario`);
  console.log(`   • ${logs.length} Request Logs`);
  console.log('━'.repeat(60));
  console.log('\n🚀 Quick Start:');
  console.log(`\n1. View Projects: http://localhost:3000`);
  console.log(`\n2. Demo Project ID: ${ecomProject.id}`);
  console.log(`   Mock URL: http://localhost:3001/mock/${ecomProject.id}`);
  console.log(`\n3. Try these API calls:`);
  console.log(`   GET  http://localhost:3001/api/projects/${ecomProject.id}/environments`);
  console.log(`   GET  http://localhost:3001/api/templates`);
  console.log(`   GET  http://localhost:3001/api/projects/${ecomProject.id}/webhooks`);
  console.log(`   GET  http://localhost:3001/mock/${ecomProject.id}/products`);
  console.log(`\n4. Explore Phase 3 features:`);
  console.log(`   • Switch between prod/staging/dev environments`);
  console.log(`   • Apply templates to create new projects`);
  console.log(`   • Test webhook deliveries`);
  console.log(`   • View collections and response scenarios`);
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
