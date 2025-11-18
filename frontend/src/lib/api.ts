const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    endpointOverrides: number;
    requestLogs: number;
  };
}

export interface MockSpec {
  id: string;
  projectId: string;
  type: 'OPENAPI' | 'JSON_SCHEMA';
  sourceText: string;
  createdAt: string;
}

export interface DerivedRoute {
  method: string;
  path: string;
  operationId?: string;
  description?: string;
  responseSchema?: any;
}

export interface EndpointOverride {
  id: string;
  projectId: string;
  method: string;
  path: string;
  customResponseJson: string;
  enabled: boolean;
  statusCode: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestLog {
  id: string;
  projectId: string;
  method: string;
  path: string;
  statusCode: number;
  timestamp: string;
  bodyJson?: string;
  headers?: string;
  responseJson?: string;
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${API_URL}/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

// Specs
export async function createSpec(projectId: string, data: { type: 'OPENAPI' | 'JSON_SCHEMA'; sourceText: string }): Promise<MockSpec> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/specs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create spec');
  }
  return res.json();
}

export async function getSpecs(projectId: string): Promise<MockSpec[]> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/specs`);
  if (!res.ok) throw new Error('Failed to fetch specs');
  return res.json();
}

// Routes
export async function getRoutes(projectId: string): Promise<DerivedRoute[]> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/routes`);
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

// Overrides
export async function getOverrides(projectId: string): Promise<EndpointOverride[]> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/overrides`);
  if (!res.ok) throw new Error('Failed to fetch overrides');
  return res.json();
}

export async function createOverride(projectId: string, data: {
  method: string;
  path: string;
  customResponseJson: string;
  enabled?: boolean;
  statusCode?: number;
}): Promise<EndpointOverride> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create override');
  }
  return res.json();
}

export async function updateOverride(id: string, data: Partial<EndpointOverride>): Promise<EndpointOverride> {
  const res = await fetch(`${API_URL}/api/overrides/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update override');
  return res.json();
}

export async function deleteOverride(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/overrides/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete override');
}

// Logs
export async function getLogs(projectId: string, limit = 100, offset = 0): Promise<{ logs: RequestLog[]; total: number }> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/logs?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function clearLogs(projectId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/logs`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear logs');
}
