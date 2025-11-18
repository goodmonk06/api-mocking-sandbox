# API Mocking Sandbox

A powerful API mocking server that generates realistic fake data from OpenAPI specifications. Perfect for frontend development, testing, and prototyping without a backend.

## Features

- **OpenAPI Support**: Import OpenAPI 3.0 specs (YAML or JSON) and automatically generate mock endpoints
- **Smart Response Generation**: Uses JSON Schema Faker to generate realistic fake data based on your schemas
- **Custom Overrides**: Override any endpoint with custom responses and status codes
- **Request Logging**: Track all requests made to your mock server
- **Web UI**: Beautiful Next.js console to manage projects, routes, and view logs
- **Path Parameters**: Supports dynamic path parameters (e.g., `/users/{id}`)
- **Multiple Projects**: Organize different API specs into separate projects

## Tech Stack

- **Backend**: Fastify + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **OpenAPI**: `openapi-types` for parsing
- **Fake Data**: `json-schema-faker` for generating realistic mock data
- **Database**: PostgreSQL with Prisma ORM

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-mocking-sandbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   cd ..
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API: `http://localhost:3001`
   - Frontend UI: `http://localhost:3000`

## Usage

### 1. Create a Project

1. Open `http://localhost:3000` in your browser
2. Click "New Project"
3. Enter a name and description
4. Click "Create Project"

### 2. Upload an OpenAPI Spec

1. Click "View Routes" on your project
2. Click "Upload Spec"
3. Paste your OpenAPI YAML or JSON
4. Click "Upload"

Example OpenAPI spec:

```yaml
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    name:
                      type: string
                    email:
                      type: string
                      format: email
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  name:
                    type: string
                  email:
                    type: string
                    format: email
                  createdAt:
                    type: string
                    format: date-time
```

### 3. Use the Mock Server in Your Frontend

Once you've uploaded a spec, your mock server is ready! Use the base URL:

```
http://localhost:3001/mock/{projectId}
```

You can find your project ID in the URL when viewing your project routes.

**Example: React App**

```javascript
// api.js
const MOCK_API_URL = 'http://localhost:3001/mock/clq1234567890';

export async function getUsers() {
  const response = await fetch(`${MOCK_API_URL}/users`);
  return response.json();
}

export async function getUser(id) {
  const response = await fetch(`${MOCK_API_URL}/users/${id}`);
  return response.json();
}

export async function createUser(userData) {
  const response = await fetch(`${MOCK_API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
}
```

**Example: Vue App**

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/mock/clq1234567890'
});

export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
```

### 4. Add Custom Overrides (Optional)

Want to test error cases or return specific data? Add an override:

1. Go to the Routes page
2. Click "Add Override" next to any route
3. Set custom response JSON and status code
4. Click "Create Override"

Example override for testing error:
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

Status code: `404`

### 5. View Request Logs

1. Navigate to the "Request Logs" tab
2. See all requests made to your mock server
3. Click "Details" to view request/response bodies and headers
4. Logs auto-refresh every 5 seconds

## API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create a new project
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

- `GET /api/projects/:projectId/logs` - Get request logs
- `DELETE /api/projects/:projectId/logs` - Clear all logs

### Mock Server

- `ALL /mock/:projectId/*` - The mock server endpoint (handles all HTTP methods)

## Architecture

```
api-mocking-sandbox/
├── backend/                # Fastify backend
│   ├── src/
│   │   ├── engine/         # Core mocking engine
│   │   │   ├── openapi-parser.ts    # OpenAPI spec parsing
│   │   │   ├── schema-faker.ts      # Fake data generation
│   │   │   └── mock-engine.ts       # Main mock logic
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── db.ts           # Prisma client
│   │   └── index.ts        # Server entry point
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/               # Next.js UI
│   └── src/
│       ├── app/            # Next.js pages
│       └── lib/            # API client
└── docker-compose.yml      # PostgreSQL container
```

## Database Schema

### MockProject
- `id`: Unique identifier
- `name`: Project name
- `description`: Optional description
- `createdAt`, `updatedAt`: Timestamps

### MockSpec
- `id`: Unique identifier
- `projectId`: Reference to project
- `type`: `OPENAPI` or `JSON_SCHEMA`
- `sourceText`: The spec content (YAML/JSON)
- `createdAt`: Timestamp

### MockEndpointOverride
- `id`: Unique identifier
- `projectId`: Reference to project
- `method`: HTTP method (GET, POST, etc.)
- `path`: Endpoint path
- `customResponseJson`: Custom response data
- `enabled`: Whether override is active
- `statusCode`: HTTP status code
- `createdAt`, `updatedAt`: Timestamps

### RequestLog
- `id`: Unique identifier
- `projectId`: Reference to project
- `method`: HTTP method
- `path`: Request path
- `statusCode`: Response status code
- `timestamp`: When request was made
- `bodyJson`: Request body (if any)
- `headers`: Request headers
- `responseJson`: Response sent back

## Development

### Running Backend Only

```bash
cd backend
npm run dev
```

### Running Frontend Only

```bash
cd frontend
npm run dev
```

### Database Commands

```bash
# Create a migration
cd backend
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Production Build

```bash
# Build both frontend and backend
npm run build

# Start in production mode
npm start
```

## Use Cases

1. **Frontend Development**: Develop frontend features without waiting for backend APIs
2. **Testing**: Test edge cases and error scenarios with custom overrides
3. **Prototyping**: Quickly prototype new features with realistic data
4. **API Documentation**: Use as interactive API documentation
5. **Integration Testing**: Mock external APIs in your integration tests
6. **Client Demos**: Demo frontend features with realistic-looking data

## Configuration

### Backend (.env)

```env
DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/apimocking?schema=public"
PORT=3001
HOST=0.0.0.0
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tips & Best Practices

1. **Use Examples in Your OpenAPI Spec**: JSON Schema Faker uses examples when available
2. **Path Parameters**: Use OpenAPI path parameter syntax: `/users/{id}`
3. **Override Wisely**: Use overrides for testing error cases and edge scenarios
4. **Clear Logs Regularly**: Logs can grow large; clear them periodically
5. **Version Control**: Store your OpenAPI specs in git alongside your frontend code
6. **Environment Variables**: Use different mock server URLs for dev/staging/prod

## Troubleshooting

**Problem**: Routes not showing up after uploading spec

**Solution**: Make sure your OpenAPI spec is valid. Check the console for parsing errors.

---

**Problem**: Mock server returns 404 for all requests

**Solution**: Verify you're using the correct project ID in the URL and that you've uploaded a spec.

---

**Problem**: Database connection errors

**Solution**: Make sure PostgreSQL is running: `docker-compose ps`

---

**Problem**: Can't connect from frontend app

**Solution**: Check CORS settings if deploying. The backend allows all origins in development.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

---

Built with ❤️ for developers who want to move fast and mock things.
