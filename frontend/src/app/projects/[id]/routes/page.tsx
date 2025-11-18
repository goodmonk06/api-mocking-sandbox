'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProject,
  getRoutes,
  getOverrides,
  getSpecs,
  createSpec,
  createOverride,
  updateOverride,
  deleteOverride,
  DerivedRoute,
  EndpointOverride,
  Project,
} from '@/lib/api';

export default function RoutesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [routes, setRoutes] = useState<DerivedRoute[]>([]);
  const [overrides, setOverrides] = useState<EndpointOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DerivedRoute | null>(null);

  const [specType, setSpecType] = useState<'OPENAPI' | 'JSON_SCHEMA'>('OPENAPI');
  const [specText, setSpecText] = useState('');

  const [overrideMethod, setOverrideMethod] = useState('GET');
  const [overridePath, setOverridePath] = useState('');
  const [overrideResponse, setOverrideResponse] = useState('{\n  "message": "Custom response"\n}');
  const [overrideStatus, setOverrideStatus] = useState(200);

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, routesData, overridesData, specs] = await Promise.all([
        getProject(projectId),
        getRoutes(projectId),
        getOverrides(projectId),
        getSpecs(projectId),
      ]);
      setProject(projectData);
      setRoutes(routesData);
      setOverrides(overridesData);
      if (specs.length === 0) {
        setShowSpecForm(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSpec(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createSpec(projectId, { type: specType, sourceText: specText });
      setSpecText('');
      setShowSpecForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreateOverride(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createOverride(projectId, {
        method: overrideMethod,
        path: overridePath,
        customResponseJson: overrideResponse,
        statusCode: overrideStatus,
      });
      setShowOverrideForm(false);
      setSelectedRoute(null);
      setOverridePath('');
      setOverrideResponse('{\n  "message": "Custom response"\n}');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleToggleOverride(override: EndpointOverride) {
    try {
      await updateOverride(override.id, { enabled: !override.enabled });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteOverride(id: string) {
    if (!confirm('Delete this override?')) return;
    try {
      await deleteOverride(id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function openOverrideForm(route?: DerivedRoute) {
    if (route) {
      setSelectedRoute(route);
      setOverrideMethod(route.method);
      setOverridePath(route.path);
    }
    setShowOverrideForm(true);
  }

  const mockBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/mock/${projectId}`;

  return (
    <>
      <div className="header">
        <div className="container">
          <h1>{project?.name || 'Loading...'}</h1>
          <p>{project?.description || 'Mock API Project'}</p>
        </div>
      </div>

      <div className="container">
        <div className="nav">
          <Link href="/" style={{ fontWeight: 500 }}>← Projects</Link>
          <Link href={`/projects/${projectId}/routes`} className="active">Routes</Link>
          <Link href={`/projects/${projectId}/logs`}>Request Logs</Link>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <h3>Mock Base URL</h3>
          <code style={{ fontSize: '14px', display: 'block', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            {mockBaseUrl}
          </code>
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#7f8c8d' }}>
            Use this base URL in your frontend app to point to the mock server.
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {routes.length === 0 && (
              <div className="card">
                <h3>No OpenAPI Spec Uploaded</h3>
                <p style={{ marginBottom: '15px' }}>Upload an OpenAPI spec to get started.</p>
                <button className="btn btn-primary" onClick={() => setShowSpecForm(!showSpecForm)}>
                  {showSpecForm ? 'Cancel' : 'Upload Spec'}
                </button>
              </div>
            )}

            {showSpecForm && (
              <div className="card">
                <h3>Upload API Specification</h3>
                <form onSubmit={handleCreateSpec}>
                  <label className="label">Spec Type</label>
                  <select
                    className="select"
                    value={specType}
                    onChange={(e) => setSpecType(e.target.value as any)}
                  >
                    <option value="OPENAPI">OpenAPI (YAML or JSON)</option>
                    <option value="JSON_SCHEMA">JSON Schema</option>
                  </select>

                  <label className="label">Specification Content</label>
                  <textarea
                    className="textarea"
                    value={specText}
                    onChange={(e) => setSpecText(e.target.value)}
                    required
                    placeholder="Paste your OpenAPI YAML or JSON here..."
                    style={{ minHeight: '300px' }}
                  />

                  <div className="flex flex-gap">
                    <button type="submit" className="btn btn-success">Upload</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowSpecForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {routes.length > 0 && (
              <>
                <div className="flex-between mb-2">
                  <h2>Available Routes ({routes.length})</h2>
                  <div className="flex flex-gap">
                    <button className="btn btn-secondary" onClick={() => setShowSpecForm(!showSpecForm)}>
                      Update Spec
                    </button>
                    <button className="btn btn-primary" onClick={() => openOverrideForm()}>
                      + Add Override
                    </button>
                  </div>
                </div>

                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Description</th>
                        <th>Override</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((route, idx) => {
                        const override = overrides.find(
                          o => o.method === route.method && o.path === route.path
                        );
                        return (
                          <tr key={idx}>
                            <td>
                              <span className={`method-badge method-${route.method}`}>
                                {route.method}
                              </span>
                            </td>
                            <td><code>{route.path}</code></td>
                            <td style={{ fontSize: '13px' }}>{route.description || '-'}</td>
                            <td>
                              {override && (
                                <span className={`badge ${override.enabled ? 'badge-success' : 'badge-danger'}`}>
                                  {override.enabled ? 'Active' : 'Disabled'}
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => openOverrideForm(route)}
                              >
                                {override ? 'Edit Override' : 'Add Override'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {overrides.length > 0 && (
              <>
                <h2 className="mt-2">Endpoint Overrides ({overrides.length})</h2>
                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Status</th>
                        <th>Enabled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overrides.map((override) => (
                        <tr key={override.id}>
                          <td>
                            <span className={`method-badge method-${override.method}`}>
                              {override.method}
                            </span>
                          </td>
                          <td><code>{override.path}</code></td>
                          <td>{override.statusCode}</td>
                          <td>
                            <label style={{ cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={override.enabled}
                                onChange={() => handleToggleOverride(override)}
                              />
                              {' '}{override.enabled ? 'Yes' : 'No'}
                            </label>
                          </td>
                          <td>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => handleDeleteOverride(override.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {showOverrideForm && (
              <div className="card mt-2">
                <h3>Create Endpoint Override</h3>
                <form onSubmit={handleCreateOverride}>
                  <label className="label">HTTP Method</label>
                  <select
                    className="select"
                    value={overrideMethod}
                    onChange={(e) => setOverrideMethod(e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>

                  <label className="label">Path</label>
                  <input
                    type="text"
                    className="input"
                    value={overridePath}
                    onChange={(e) => setOverridePath(e.target.value)}
                    required
                    placeholder="/users/{id}"
                  />

                  <label className="label">Status Code</label>
                  <input
                    type="number"
                    className="input"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(Number(e.target.value))}
                    required
                  />

                  <label className="label">Custom Response (JSON)</label>
                  <textarea
                    className="textarea"
                    value={overrideResponse}
                    onChange={(e) => setOverrideResponse(e.target.value)}
                    required
                    placeholder='{"message": "Custom response"}'
                    style={{ minHeight: '150px' }}
                  />

                  <div className="flex flex-gap">
                    <button type="submit" className="btn btn-success">Create Override</button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowOverrideForm(false);
                        setSelectedRoute(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
