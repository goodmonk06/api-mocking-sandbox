import prisma from '../db';
import { OpenAPIParser } from './openapi-parser';
import { SchemaFaker } from './schema-faker';
import { MockEngineContext, MockResponse, DerivedRoute } from '../types';

export class MockEngine {
  /**
   * Get a mock response for a given request
   */
  static async getMockResponse(context: MockEngineContext): Promise<MockResponse> {
    const { projectId, method, path } = context;

    // 1. Check for endpoint override
    const override = await this.findOverride(projectId, method, path);
    if (override && override.enabled) {
      return {
        statusCode: override.statusCode,
        data: JSON.parse(override.customResponseJson),
        isOverride: true,
      };
    }

    // 2. Get the spec and generate response
    const spec = await prisma.mockSpec.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!spec) {
      return {
        statusCode: 404,
        data: { error: 'No spec found for this project' },
        isOverride: false,
      };
    }

    // 3. Parse spec and find matching route
    const doc = OpenAPIParser.parse(spec.sourceText);
    const routes = OpenAPIParser.extractRoutes(doc);
    const matchedRoute = this.matchRoute(routes, method, path);

    if (!matchedRoute) {
      return {
        statusCode: 404,
        data: { error: `Route not found: ${method} ${path}` },
        isOverride: false,
      };
    }

    // 4. Generate fake response from schema
    if (matchedRoute.responseSchema) {
      const resolvedSchema = OpenAPIParser.resolveSchema(matchedRoute.responseSchema, doc);
      const fakeData = SchemaFaker.generate(resolvedSchema);
      return {
        statusCode: 200,
        data: fakeData,
        isOverride: false,
      };
    }

    return {
      statusCode: 200,
      data: { message: 'Success (no schema defined)' },
      isOverride: false,
    };
  }

  /**
   * Find an override for a specific endpoint
   */
  private static async findOverride(projectId: string, method: string, path: string) {
    // Try exact match first
    let override = await prisma.mockEndpointOverride.findFirst({
      where: {
        projectId,
        method: method.toUpperCase(),
        path,
        enabled: true,
      },
    });

    if (override) return override;

    // Try pattern matching (e.g., /users/{id} matches /users/123)
    const allOverrides = await prisma.mockEndpointOverride.findMany({
      where: {
        projectId,
        method: method.toUpperCase(),
        enabled: true,
      },
    });

    for (const ovr of allOverrides) {
      if (this.pathMatches(ovr.path, path)) {
        return ovr;
      }
    }

    return null;
  }

  /**
   * Match a route from the spec to the incoming request
   */
  private static matchRoute(routes: DerivedRoute[], method: string, path: string): DerivedRoute | null {
    // Try exact match first
    let route = routes.find((r) => r.method === method.toUpperCase() && r.path === path);
    if (route) return route;

    // Try pattern matching
    for (const r of routes) {
      if (r.method === method.toUpperCase() && this.pathMatches(r.path, path)) {
        return r;
      }
    }

    return null;
  }

  /**
   * Check if a path pattern matches an actual path
   * E.g., /users/{id} matches /users/123
   */
  private static pathMatches(pattern: string, actualPath: string): boolean {
    const patternParts = pattern.split('/').filter(Boolean);
    const actualParts = actualPath.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const actualPart = actualParts[i];

      // Check if it's a parameter (e.g., {id})
      if (patternPart.startsWith('{') && patternPart.endsWith('}')) {
        continue; // Parameters match anything
      }

      if (patternPart !== actualPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all routes for a project
   */
  static async getProjectRoutes(projectId: string): Promise<DerivedRoute[]> {
    const spec = await prisma.mockSpec.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!spec) {
      return [];
    }

    const doc = OpenAPIParser.parse(spec.sourceText);
    return OpenAPIParser.extractRoutes(doc);
  }
}
