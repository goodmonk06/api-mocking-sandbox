import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import { DerivedRoute } from '../types';

export class OpenAPIParser {
  /**
   * Parse OpenAPI document from YAML or JSON string
   */
  static parse(sourceText: string): OpenAPIV3.Document {
    try {
      // Try parsing as JSON first
      return JSON.parse(sourceText) as OpenAPIV3.Document;
    } catch {
      // If JSON fails, try YAML
      return yaml.load(sourceText) as OpenAPIV3.Document;
    }
  }

  /**
   * Extract all routes from an OpenAPI document
   */
  static extractRoutes(doc: OpenAPIV3.Document): DerivedRoute[] {
    const routes: DerivedRoute[] = [];

    if (!doc.paths) {
      return routes;
    }

    for (const [path, pathItem] of Object.entries(doc.paths)) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
        if (!operation) continue;

        // Get the response schema for 200/201 responses
        const responses = operation.responses;
        let responseSchema: any = undefined;

        if (responses) {
          const successResponse = (responses['200'] || responses['201']) as OpenAPIV3.ResponseObject | undefined;
          if (successResponse && 'content' in successResponse) {
            const content = successResponse.content;
            if (content && content['application/json']) {
              responseSchema = content['application/json'].schema;
            }
          }
        }

        routes.push({
          method: method.toUpperCase(),
          path,
          operationId: operation.operationId,
          description: operation.description || operation.summary,
          responseSchema,
        });
      }
    }

    return routes;
  }

  /**
   * Resolve $ref in a schema using the components section
   */
  static resolveSchema(schema: any, doc: OpenAPIV3.Document): any {
    if (!schema) return schema;

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      let resolved: any = doc;

      for (const part of refPath) {
        resolved = resolved?.[part];
      }

      // Recursively resolve nested refs
      return this.resolveSchema(resolved, doc);
    }

    // Recursively resolve properties
    if (schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = this.resolveSchema(value, doc);
      }
      return { ...schema, properties: resolvedProperties };
    }

    if (schema.items) {
      return { ...schema, items: this.resolveSchema(schema.items, doc) };
    }

    if (schema.allOf) {
      // Merge all schemas in allOf
      const merged: any = { type: 'object', properties: {} };
      for (const subSchema of schema.allOf) {
        const resolved = this.resolveSchema(subSchema, doc);
        if (resolved.properties) {
          merged.properties = { ...merged.properties, ...resolved.properties };
        }
      }
      return merged;
    }

    return schema;
  }
}
