import { describe, it, expect } from 'vitest';
import { OpenAPIParser } from '../openapi-parser';

describe('OpenAPIParser', () => {
  const sampleOpenAPI = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
  /users/{id}:
    get:
      summary: Get user by ID
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
    post:
      summary: Create user
      responses:
        '201':
          description: Created
`;

  describe('parse', () => {
    it('should parse YAML OpenAPI spec', () => {
      const doc = OpenAPIParser.parse(sampleOpenAPI);
      expect(doc).toBeDefined();
      expect(doc.openapi).toBe('3.0.0');
      expect(doc.info.title).toBe('Test API');
    });

    it('should parse JSON OpenAPI spec', () => {
      const jsonSpec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'JSON API', version: '1.0.0' },
        paths: {},
      });
      const doc = OpenAPIParser.parse(jsonSpec);
      expect(doc.info.title).toBe('JSON API');
    });
  });

  describe('extractRoutes', () => {
    it('should extract all routes from OpenAPI document', () => {
      const doc = OpenAPIParser.parse(sampleOpenAPI);
      const routes = OpenAPIParser.extractRoutes(doc);

      expect(routes).toHaveLength(3);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        path: '/users',
      });
      expect(routes[1]).toMatchObject({
        method: 'GET',
        path: '/users/{id}',
      });
      expect(routes[2]).toMatchObject({
        method: 'POST',
        path: '/users/{id}',
      });
    });

    it('should extract response schemas', () => {
      const doc = OpenAPIParser.parse(sampleOpenAPI);
      const routes = OpenAPIParser.extractRoutes(doc);

      const getUsersRoute = routes.find((r) => r.method === 'GET' && r.path === '/users');
      expect(getUsersRoute?.responseSchema).toBeDefined();
      expect(getUsersRoute?.responseSchema.type).toBe('array');
    });

    it('should handle empty paths', () => {
      const emptyDoc = {
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
      };
      const routes = OpenAPIParser.extractRoutes(emptyDoc as any);
      expect(routes).toHaveLength(0);
    });
  });

  describe('resolveSchema', () => {
    it('should resolve $ref references', () => {
      const doc = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      };

      const schema = { $ref: '#/components/schemas/User' };
      const resolved = OpenAPIParser.resolveSchema(schema, doc as any);

      expect(resolved.type).toBe('object');
      expect(resolved.properties.id.type).toBe('string');
    });

    it('should handle nested $ref', () => {
      const doc = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                profile: { $ref: '#/components/schemas/Profile' },
              },
            },
            Profile: {
              type: 'object',
              properties: {
                bio: { type: 'string' },
              },
            },
          },
        },
      };

      const schema = { $ref: '#/components/schemas/User' };
      const resolved = OpenAPIParser.resolveSchema(schema, doc as any);

      expect(resolved.properties.profile.type).toBe('object');
      expect(resolved.properties.profile.properties.bio.type).toBe('string');
    });
  });
});
