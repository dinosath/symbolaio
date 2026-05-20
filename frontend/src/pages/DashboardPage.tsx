import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { useWorkspaceStore } from '../stores/workspace';
import {
  getClient,
  PAGES_QUERY,
  CREATE_PAGE_MUTATION,
  OBJECT_SCHEMAS_QUERY,
  SERVICES_QUERY,
} from '../api/graphql';
import type { Page, ObjectSchema, Service } from '../types';

export default function DashboardPage() {
  const logout = useAuthStore((s) => s.logout);
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // If no workspace selected, prompt creation (simplified: use first available or create)
  // For Phase 1, we'll use a hard-coded workspace setup flow

  const pagesQuery = useQuery({
    queryKey: ['pages', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await getClient().request<{ pages: Page[] }>(PAGES_QUERY, {
        workspaceId,
      });
      return data.pages;
    },
    enabled: !!workspaceId,
  });

  const objectsQuery = useQuery({
    queryKey: ['objectSchemas', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await getClient().request<{
        objectSchemas: ObjectSchema[];
      }>(OBJECT_SCHEMAS_QUERY, { workspaceId });
      return data.objectSchemas;
    },
    enabled: !!workspaceId,
  });

  const servicesQuery = useQuery({
    queryKey: ['services', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await getClient().request<{ services: Service[] }>(
        SERVICES_QUERY,
        { workspaceId },
      );
      return data.services;
    },
    enabled: !!workspaceId,
  });

  const createPage = useMutation({
    mutationFn: async () => {
      const data = await getClient().request<{
        createPage: Page;
      }>(CREATE_PAGE_MUTATION, {
        input: {
          workspaceId,
          name: 'Untitled Page',
          blocks: [],
        },
      });
      return data.createPage;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      navigate(`/pages/${page.id}`);
    },
  });

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Workspace Selected</h2>
          <p className="text-gray-500 mb-4">
            Create a workspace via GraphQL playground at{' '}
            <code className="bg-gray-100 px-1 rounded">/graphql</code>
          </p>
          <input
            className="px-3 py-2 border rounded-md mr-2"
            placeholder="Workspace ID"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                useWorkspaceStore
                  .getState()
                  .setWorkspace((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-900">Symbolaio</h1>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-brand-600">
            Dashboard
          </Link>
          <Link to="/objects" className="text-sm font-medium text-gray-700 hover:text-brand-600">
            Objects
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-3 gap-6">
        {/* Pages */}
        <section className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pages</h2>
            <button
              onClick={() => createPage.mutate()}
              disabled={createPage.isPending}
              className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              + New Page
            </button>
          </div>

          {pagesQuery.isLoading && <p className="text-gray-400">Loading…</p>}
          {pagesQuery.data?.length === 0 && (
            <p className="text-gray-400">No pages yet. Create one!</p>
          )}

          <div className="space-y-2">
            {pagesQuery.data?.map((page) => (
              <Link
                key={page.id}
                to={`/pages/${page.id}`}
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium">{page.name}</h3>
                <p className="text-xs text-gray-400">
                  Updated {new Date(page.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Objects */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Objects</h2>
            {objectsQuery.data?.length === 0 && (
              <p className="text-gray-400 text-sm">No object schemas.</p>
            )}
            {objectsQuery.data?.map((obj) => (
              <Link
                key={obj.id}
                to={`/objects/${obj.id}`}
                className="block p-2 text-sm hover:bg-gray-100 rounded"
              >
                {obj.name}
              </Link>
            ))}
          </section>

          {/* Connected Services */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Services</h2>
            {servicesQuery.data?.length === 0 && (
              <p className="text-gray-400 text-sm">
                No services registered yet.
              </p>
            )}
            {servicesQuery.data?.map((svc) => (
              <div key={svc.id} className="p-2 text-sm">
                <span className="font-medium">{svc.name}</span>
                <span className="ml-2 text-xs text-green-600">●</span>
              </div>
            ))}
          </section>
        </aside>
      </main>
    </div>
  );
}
