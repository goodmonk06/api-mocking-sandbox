# API Mocking Sandbox

A production-ready API mocking server that generates realistic fake data from OpenAPI specifications. Build and test your frontend applications without waiting for backend APIs.

## Overview

The API Mocking Sandbox is a complete solution for mocking REST APIs during development, testing, and prototyping. It parses OpenAPI 3.0 specifications and automatically generates realistic mock responses using JSON Schema Faker. You can override specific endpoints with custom responses, track all requests, and manage multiple projects through a clean web interface.

**Key Benefits:**
- **Zero Backend Dependency**: Develop frontend features independently
- **Realistic Data**: Auto-generated fake data based on your schemas
- **Full Control**: Override any endpoint with custom responses
- **Request Tracking**: Monitor and debug all API calls
- **Multiple Projects**: Organize different API specs separately

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Validation**: Zod for runtime type-safe validation
- **OpenAPI**: `openapi-types` for spec parsing, `js-yaml` for YAML support
- **Mock Data**: `json-schema-faker` for generating realistic fake data
- **Testing**: Vitest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Custom CSS (no framework dependencies)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL in Docker
- **Monorepo**: npm workspaces

## Domain Model

### Core Entities

```
MockProject
├── id: string (cuid)
├── name: string
├── description: string?
├── createdAt: DateTime
├── updatedAt: DateTime
└── Relations:
    ├── specs: MockSpec[]
    ├── endpointOverrides: MockEndpointOverride[]
    └── requestLogs: RequestLog[]

MockSpec
├── id: string (cuid)
├── projectId: string → MockProject
├── type: enum(OPENAPI, JSON_SCHEMA)
├── sourceText: text (YAML/JSON content)
└── createdAt: DateTime

MockEndpointOverride
├── id: string (cuid)
├── projectId: string → MockProject
├── method: string (GET, POST, PUT, DELETE, PATCH)
├── path: string (e.g., /users/{id})
├── customResponseJson: text
├── enabled: boolean
├── statusCode: integer (100-599)
├── createdAt: DateTime
└── updatedAt: DateTime

RequestLog
├── id: string (cuid)
├── projectId: string → MockProject
├── method: string
├── path: string
├── statusCode: integer
├── timestamp: DateTime
├── bodyJson: text?
├── headers: text?
└── responseJson: text?
```

### Key Relationships

- **One Project** has many **Specs** (typically one active spec)
- **One Project** has many **Endpoint Overrides** (custom responses)
- **One Project** has many **Request Logs** (audit trail)

## Getting Started

### Requirements

- **Node.js** 20 or higher
- **npm** 9 or higher
- **Docker** & **Docker Compose** (for PostgreSQL)
- **Git**

### Setup Steps

#### Option 1: Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-mocking-sandbox
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example backend/.env
   cp .env.example frontend/.env.local
   ```

3. **Start everything with Docker Compose**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

4. **Initialize the database** (first time only)
   ```bash
   # Wait for containers to be healthy, then:
   docker exec -it api-mocking-backend npx prisma migrate deploy
   docker exec -it api-mocking-backend npm run db:seed
   ```

5. **Access the application**
   - Frontend UI: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

#### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-mocking-sandbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up -d postgres
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example backend/.env
   cp .env.example frontend/.env.local
   ```

5. **Set up the database**
   ```bash
   npm run db:setup     # Run migrations and generate Prisma client
   npm run db:seed      # Load demo data
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both backend (port 3001) and frontend (port 3000) in watch mode.

### Verification

After setup, verify the installation:

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-18T..."}

# List projects (should show demo project)
curl http://localhost:3001/api/projects
```

## Example Flow: Complete Vertical Slice

Here's a complete end-to-end workflow demonstrating the core functionality:

### Step 1: Access the Demo Project

After running `npm run db:seed`, you'll have a demo e-commerce project. The seed script outputs the project ID.

```bash
# Get the demo project ID from seed output, or:
curl http://localhost:3001/api/projects | jq '.[0].id'
```

### Step 2: Explore Available Routes

Visit the frontend at http://localhost:3000:
1. Click on "E-commerce API Demo" project
2. View the "Routes" tab to see all endpoints derived from the OpenAPI spec

Or via API:
```bash
PROJECT_ID="<your-project-id>"
curl http://localhost:3001/api/projects/$PROJECT_ID/routes
```

### Step 3: Make Mock API Requests

The mock server is available at `/mock/:projectId/*`. Try these endpoints:

```bash
# Get all products (auto-generated fake data)
curl http://localhost:3001/mock/$PROJECT_ID/products

# Get a specific product (path parameter matching)
curl http://localhost:3001/mock/$PROJECT_ID/products/prod_123

# Get user profile (custom override with realistic data)
curl http://localhost:3001/mock/$PROJECT_ID/users/me

# Create an order (custom override returns confirmation)
curl -X POST http://localhost:3001/mock/$PROJECT_ID/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","items":[{"productId":"prod_123","quantity":2}]}'

# Special deal endpoint (custom override)
curl http://localhost:3001/mock/$PROJECT_ID/products/special-deal
```

### Step 4: View Request Logs

All requests are logged. View them in the UI:
1. Go to the "Request Logs" tab
2. Click "Details" on any log entry to see full request/response

Or via API:
```bash
curl http://localhost:3001/api/projects/$PROJECT_ID/logs
```

### Step 5: Add a Custom Override

Override an endpoint to return specific test data:

**Via UI:**
1. Go to Routes tab
2. Click "Add Override" next to any route
3. Enter custom JSON response
4. Submit

**Via API:**
```bash
curl -X POST http://localhost:3001/api/projects/$PROJECT_ID/overrides \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/products/test-404",
    "statusCode": 404,
    "customResponseJson": "{\"error\":\"Product not found\",\"code\":\"NOT_FOUND\"}"
  }'

# Test the override
curl http://localhost:3001/mock/$PROJECT_ID/products/test-404
# Returns: {"error":"Product not found","code":"NOT_FOUND"}
```

### Step 6: Use in Your Frontend App

Point your frontend to the mock server:

**React Example:**
```javascript
// api/config.js
export const API_BASE_URL = process.env.REACT_APP_MOCK_API ||
  'http://localhost:3001/mock/<project-id>';

// api/products.js
import { API_BASE_URL } from './config';

export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);
  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  return response.json();
}
```

**Vue/Nuxt Example:**
```javascript
// plugins/api.js
export default defineNuxtPlugin(() => {
  const baseURL = 'http://localhost:3001/mock/<project-id>';

  return {
    provide: {
      api: {
        getProducts: () => $fetch(`${baseURL}/products`),
        getProduct: (id) => $fetch(`${baseURL}/products/${id}`),
      }
    }
  };
});
```

## Available Scripts

### Root Level

```bash
npm run dev              # Start both backend & frontend in dev mode
npm run dev:backend      # Start only backend in dev mode
npm run dev:frontend     # Start only frontend in dev mode
npm run build            # Build both backend & frontend for production
npm run start            # Start both backend & frontend in production mode
npm test                 # Run backend tests
npm run lint             # Lint both backend & frontend

# Database
npm run db:setup         # Initialize database (migrate + generate client)
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes (dev only)
npm run db:seed          # Seed database with demo data

# Docker
npm run docker:build     # Build Docker images
npm run docker:up        # Start all containers
npm run docker:down      # Stop all containers
npm run docker:logs      # View container logs
```

### Backend

```bash
cd backend
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm run start            # Start compiled server
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Type-check with TypeScript
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
```

### Frontend

```bash
cd frontend
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run Next.js linter
```

## Testing

Run the test suite:

```bash
npm test
```

The backend includes tests for:
- **OpenAPI Parser**: Spec parsing, route extraction, $ref resolution
- **Schema Faker**: Mock data generation from JSON schemas
- **API Endpoints**: Full request/response validation (coming soon)

Example test output:
```
✓ src/engine/__tests__/openapi-parser.test.ts (8 tests)
✓ src/engine/__tests__/schema-faker.test.ts (6 tests)

Test Files  2 passed (2)
     Tests  14 passed (14)
```

## API Documentation

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Specs

- `GET /api/projects/:projectId/specs` - List specs for a project
- `POST /api/projects/:projectId/specs` - Upload a new spec
- `DELETE /api/specs/:id` - Delete a spec

### Routes

- `GET /api/projects/:projectId/routes` - Get all derived routes from spec

### Overrides

- `GET /api/projects/:projectId/overrides` - List all overrides
- `POST /api/projects/:projectId/overrides` - Create an override
- `PUT /api/overrides/:id` - Update an override
- `DELETE /api/overrides/:id` - Delete an override

### Logs

- `GET /api/projects/:projectId/logs?limit=100&offset=0` - Get request logs
- `DELETE /api/projects/:projectId/logs` - Clear all logs

### Mock Server

- `ALL /mock/:projectId/*` - The mock server endpoint (handles all HTTP methods)

All API endpoints use Zod for validation and return consistent error responses:

```json
{
  "error": "Validation Error",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

## Future Extensions

### Phase 3 Enhancements
- **GraphQL Support**: Parse GraphQL schemas and generate mock resolvers
- **Authentication Simulation**: Mock JWT tokens and auth flows
- **Rate Limiting Simulation**: Test rate limit handling
- **Network Conditions**: Simulate latency, timeouts, intermittent failures
- **Response Templates**: Template language for dynamic responses (Faker.js integration)
- **Import/Export**: Share project configurations as JSON
- **Webhooks**: Trigger webhooks on specific mock requests
- **WebSocket Support**: Mock WebSocket connections

### Integration & Ecosystem
- **Playwright/Cypress Integration**: Use as test fixture server
- **OpenAPI Code Generation**: Generate TypeScript types from specs
- **Postman Collection Export**: Export mock endpoints as Postman collections
- **CLI Tool**: Command-line interface for CI/CD pipelines
- **VS Code Extension**: Manage mocks directly from editor

### Advanced Features
- **State Management**: Maintain state across requests (e.g., POST creates, GET retrieves)
- **Scenario Recording**: Record real API responses and replay them
- **Smart Defaults**: Learn from real API usage patterns
- **Multi-tenancy**: User accounts and private projects
- **Analytics Dashboard**: Visualize API usage patterns

## Contributing

Contributions are welcome! Areas that need attention:
- Frontend tests
- E2E test suite
- GraphQL support
- Performance optimization
- Documentation improvements

## License

MIT

---

**Built for developers who want to move fast and mock everything.**

For questions or issues, please open a GitHub issue.
