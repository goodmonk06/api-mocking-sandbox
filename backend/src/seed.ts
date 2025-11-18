import prisma from './db';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Starting seed...');

  // Clean up existing data
  await prisma.requestLog.deleteMany();
  await prisma.mockEndpointOverride.deleteMany();
  await prisma.mockSpec.deleteMany();
  await prisma.mockProject.deleteMany();

  console.log('Cleaned up existing data');

  // Create demo project
  const project = await prisma.mockProject.create({
    data: {
      name: 'E-commerce API Demo',
      description: 'A demo e-commerce API with products, users, and orders',
    },
  });

  console.log('Created project:', project.name);

  // Load sample OpenAPI spec
  const sampleSpecPath = path.join(__dirname, '../../examples/sample-openapi.yaml');
  const sampleSpec = fs.readFileSync(sampleSpecPath, 'utf-8');

  // Create spec
  const spec = await prisma.mockSpec.create({
    data: {
      projectId: project.id,
      type: 'OPENAPI',
      sourceText: sampleSpec,
    },
  });

  console.log('Created OpenAPI spec');

  // Create some custom overrides
  const overrides = [
    {
      projectId: project.id,
      method: 'GET',
      path: '/products/special-deal',
      statusCode: 200,
      enabled: true,
      customResponseJson: JSON.stringify({
        id: 'prod_special',
        name: 'Special Deal - Wireless Headphones',
        description: 'Limited time offer! Get 50% off on premium wireless headphones',
        price: 49.99,
        originalPrice: 99.99,
        category: 'Electronics',
        inStock: true,
        imageUrl: 'https://example.com/special-deal.jpg',
        discount: '50%',
      }),
    },
    {
      projectId: project.id,
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      enabled: true,
      customResponseJson: JSON.stringify({
        id: 'order_demo',
        userId: 'user_123',
        items: [
          {
            productId: 'prod_123',
            quantity: 2,
            price: 99.99,
          },
        ],
        total: 199.98,
        status: 'confirmed',
        estimatedDelivery: '2025-11-25',
        trackingNumber: 'TRK123456789',
      }),
    },
    {
      projectId: project.id,
      method: 'GET',
      path: '/users/me',
      statusCode: 200,
      enabled: true,
      customResponseJson: JSON.stringify({
        id: 'user_demo',
        email: 'demo@example.com',
        name: 'Demo User',
        avatar: 'https://example.com/avatar.jpg',
        role: 'customer',
        memberSince: '2024-01-15',
        totalOrders: 42,
        favoriteCategories: ['Electronics', 'Books', 'Home & Garden'],
      }),
    },
  ];

  for (const override of overrides) {
    await prisma.mockEndpointOverride.create({ data: override });
  }

  console.log('Created custom endpoint overrides');

  // Create some sample request logs
  const logs = [
    {
      projectId: project.id,
      method: 'GET',
      path: '/products',
      statusCode: 200,
      bodyJson: null,
      headers: JSON.stringify({ 'user-agent': 'Demo Client' }),
      responseJson: JSON.stringify([{ id: 'prod_1', name: 'Product 1' }]),
    },
    {
      projectId: project.id,
      method: 'GET',
      path: '/products/prod_123',
      statusCode: 200,
      bodyJson: null,
      headers: JSON.stringify({ 'user-agent': 'Demo Client' }),
      responseJson: JSON.stringify({ id: 'prod_123', name: 'Wireless Headphones' }),
    },
    {
      projectId: project.id,
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      bodyJson: JSON.stringify({ userId: 'user_123', items: [{ productId: 'prod_123', quantity: 1 }] }),
      headers: JSON.stringify({ 'user-agent': 'Demo Client', 'content-type': 'application/json' }),
      responseJson: JSON.stringify({ id: 'order_1', status: 'created' }),
    },
  ];

  for (const log of logs) {
    await prisma.requestLog.create({ data: log });
  }

  console.log('Created sample request logs');

  console.log('\n✅ Seed completed successfully!');
  console.log(`\nDemo Project ID: ${project.id}`);
  console.log(`Mock Server URL: http://localhost:3001/mock/${project.id}`);
  console.log(`\nTry these endpoints:`);
  console.log(`  GET  http://localhost:3001/mock/${project.id}/products`);
  console.log(`  GET  http://localhost:3001/mock/${project.id}/products/special-deal`);
  console.log(`  GET  http://localhost:3001/mock/${project.id}/users/me`);
  console.log(`  POST http://localhost:3001/mock/${project.id}/orders`);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
