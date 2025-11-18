import { OpenAPIV3 } from 'openapi-types';

export interface DerivedRoute {
  method: string;
  path: string;
  operationId?: string;
  description?: string;
  responseSchema?: any;
}

export interface MockEngineContext {
  projectId: string;
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface MockResponse {
  statusCode: number;
  data: any;
  isOverride: boolean;
}

export type OpenAPIDocument = OpenAPIV3.Document;
