'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, createProject, deleteProject, Project } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const project = await createProject({ name, description });
      setProjects([project, ...projects]);
      setName('');
      setDescription('');
      setShowForm(false);
      router.push(`/projects/${project.id}/routes`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="header">
        <div className="container">
          <h1>API Mocking Sandbox</h1>
          <p>Create mock APIs with realistic fake data from OpenAPI specs</p>
        </div>
      </div>

      <div className="container">
        {error && <div className="error">{error}</div>}

        <div className="flex-between mb-2">
          <h2>Projects</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreate}>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="My API Project"
              />

              <label className="label">Description (optional)</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this mock API project"
                style={{ minHeight: '80px' }}
              />

              <button type="submit" className="btn btn-success">
                Create Project
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {projects.map((project) => (
              <div key={project.id} className="card">
                <h3 style={{ marginBottom: '10px' }}>{project.name}</h3>
                {project.description && (
                  <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '14px' }}>
                    {project.description}
                  </p>
                )}

                <div style={{ fontSize: '13px', color: '#95a5a6', marginBottom: '15px' }}>
                  <div>Overrides: {project._count?.endpointOverrides || 0}</div>
                  <div>Requests: {project._count?.requestLogs || 0}</div>
                </div>

                <div className="flex flex-gap">
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push(`/projects/${project.id}/routes`)}
                  >
                    View Routes
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => router.push(`/projects/${project.id}/logs`)}
                  >
                    Logs
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
