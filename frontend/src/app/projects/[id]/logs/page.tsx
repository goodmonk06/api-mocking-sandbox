'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProject, getLogs, clearLogs, RequestLog, Project } from '@/lib/api';

export default function LogsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, logsData] = await Promise.all([
        getProject(projectId),
        getLogs(projectId, 100, 0),
      ]);
      setProject(projectData);
      setLogs(logsData.logs);
      setTotal(logsData.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearLogs() {
    if (!confirm('Clear all logs for this project?')) return;
    try {
      await clearLogs(projectId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }

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
          <Link href={`/projects/${projectId}/routes`}>Routes</Link>
          <Link href={`/projects/${projectId}/logs`} className="active">Request Logs</Link>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="flex-between mb-2">
          <h2>Request Logs ({total})</h2>
          <div className="flex flex-gap">
            <button className="btn btn-secondary" onClick={loadData}>
              Refresh
            </button>
            {logs.length > 0 && (
              <button className="btn btn-danger" onClick={handleClearLogs}>
                Clear All Logs
              </button>
            )}
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="loading">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="card">
            <p>No requests logged yet. Make a request to the mock server to see logs here.</p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#7f8c8d' }}>
              Mock base URL: <code>{process.env.NEXT_PUBLIC_API_URL}/mock/{projectId}</code>
            </p>
          </div>
        ) : (
          <>
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px' }}>{formatTimestamp(log.timestamp)}</td>
                      <td>
                        <span className={`method-badge method-${log.method}`}>
                          {log.method}
                        </span>
                      </td>
                      <td><code>{log.path}</code></td>
                      <td>
                        <span
                          className={`badge ${
                            log.statusCode >= 200 && log.statusCode < 300
                              ? 'badge-success'
                              : log.statusCode >= 400
                              ? 'badge-danger'
                              : 'badge-info'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => setSelectedLog(log)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLog && (
              <div className="card mt-2">
                <div className="flex-between mb-2">
                  <h3>Request Details</h3>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedLog(null)}
                  >
                    Close
                  </button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Endpoint:</strong>{' '}
                  <span className={`method-badge method-${selectedLog.method}`}>
                    {selectedLog.method}
                  </span>{' '}
                  <code>{selectedLog.path}</code>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Status Code:</strong> {selectedLog.statusCode}
                </div>

                {selectedLog.bodyJson && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Request Body:</strong>
                    <pre style={{
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                    }}>
                      {JSON.stringify(JSON.parse(selectedLog.bodyJson), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.responseJson && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Response:</strong>
                    <pre style={{
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                    }}>
                      {JSON.stringify(JSON.parse(selectedLog.responseJson), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.headers && (
                  <div>
                    <strong>Headers:</strong>
                    <pre style={{
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      maxHeight: '200px',
                    }}>
                      {JSON.stringify(JSON.parse(selectedLog.headers), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
