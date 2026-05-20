import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '../stores/workspace';
import {
  getClient,
  OBJECT_SCHEMAS_QUERY,
  RECORDS_QUERY,
  CREATE_RECORD_MUTATION,
  DELETE_RECORD_MUTATION,
} from '../api/graphql';
import ObjectTable from '../components/ObjectTable';
import type { ObjectSchema, Record as RecordType } from '../types';

export default function ObjectsPage() {
  const { objectId } = useParams<{ objectId?: string }>();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const queryClient = useQueryClient();

  const schemasQuery = useQuery({
    queryKey: ['objectSchemas', workspaceId],
    queryFn: async () => {
      const data = await getClient().request<{
        objectSchemas: ObjectSchema[];
      }>(OBJECT_SCHEMAS_QUERY, { workspaceId });
      return data.objectSchemas;
    },
    enabled: !!workspaceId,
  });

  const selectedSchema = schemasQuery.data?.find((s) => s.id === objectId);

  const recordsQuery = useQuery({
    queryKey: ['records', objectId, workspaceId],
    queryFn: async () => {
      const data = await getClient().request<{ records: RecordType[] }>(
        RECORDS_QUERY,
        { objectId, workspaceId },
      );
      return data.records;
    },
    enabled: !!objectId && !!workspaceId,
  });

  const createRecord = useMutation({
    mutationFn: async (recordData: Record<string, unknown>) => {
      return getClient().request(CREATE_RECORD_MUTATION, {
        input: { workspaceId, objectId, data: recordData },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['records', objectId, workspaceId],
      });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      return getClient().request(DELETE_RECORD_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['records', objectId, workspaceId],
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-sm text-gray-500 hover:text-brand-600">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-semibold">Objects</h1>
      </header>

      <div className="flex max-w-6xl mx-auto">
        {/* Schema list */}
        <aside className="w-56 border-r bg-white p-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">
            Schemas
          </h3>
          {schemasQuery.data?.map((schema) => (
            <Link
              key={schema.id}
              to={`/objects/${schema.id}`}
              className={`block px-2 py-1.5 text-sm rounded ${
                schema.id === objectId
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              {schema.name}
            </Link>
          ))}
          {schemasQuery.data?.length === 0 && (
            <p className="text-xs text-gray-400">No schemas defined.</p>
          )}
        </aside>

        {/* Records table */}
        <main className="flex-1 p-6">
          {selectedSchema ? (
            <ObjectTable
              schema={selectedSchema}
              records={recordsQuery.data ?? []}
              isLoading={recordsQuery.isLoading}
              onCreateRecord={(data) => createRecord.mutate(data)}
              onDeleteRecord={(id) => deleteRecord.mutate(id)}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              Select an object schema from the sidebar.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
