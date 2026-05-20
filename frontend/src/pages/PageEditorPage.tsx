import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClient,
  PAGE_QUERY,
  UPDATE_PAGE_MUTATION,
  DELETE_PAGE_MUTATION,
} from '../api/graphql';
import BlockRenderer from '../components/BlockRenderer';
import type { Page, Block } from '../types';

export default function PageEditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pageQuery = useQuery({
    queryKey: ['page', pageId],
    queryFn: async () => {
      const data = await getClient().request<{ page: Page }>(PAGE_QUERY, {
        id: pageId,
      });
      return data.page;
    },
  });

  const [editName, setEditName] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[] | null>(null);

  // Derive display state
  const pageName = editName ?? pageQuery.data?.name ?? '';
  const displayBlocks = blocks ?? pageQuery.data?.blocks ?? [];

  const updatePage = useMutation({
    mutationFn: async (input: { name?: string; blocks?: Block[] }) => {
      const data = await getClient().request<{ updatePage: Page }>(
        UPDATE_PAGE_MUTATION,
        { id: pageId, input },
      );
      return data.updatePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async () => {
      await getClient().request(DELETE_PAGE_MUTATION, { id: pageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      navigate('/');
    },
  });

  const addBlock = useCallback(
    (type: string) => {
      const current = blocks ?? pageQuery.data?.blocks ?? [];
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type,
        props:
          type === 'heading'
            ? { level: 2, text: '' }
            : type === 'text'
              ? { content: '' }
              : type === 'columns'
                ? { columns: 2 }
                : {},
      };
      const updated = [...current, newBlock];
      setBlocks(updated);
      updatePage.mutate({ blocks: updated });
    },
    [blocks, pageQuery.data?.blocks, updatePage],
  );

  const updateBlock = useCallback(
    (blockId: string, props: Record<string, unknown>) => {
      const current = blocks ?? pageQuery.data?.blocks ?? [];
      const updated = current.map((b) =>
        b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b,
      );
      setBlocks(updated);
      updatePage.mutate({ blocks: updated });
    },
    [blocks, pageQuery.data?.blocks, updatePage],
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const current = blocks ?? pageQuery.data?.blocks ?? [];
      const updated = current.filter((b) => b.id !== blockId);
      setBlocks(updated);
      updatePage.mutate({ blocks: updated });
    },
    [blocks, pageQuery.data?.blocks, updatePage],
  );

  if (pageQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-brand-600">
            ← Back
          </Link>
          <input
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0"
            value={pageName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              if (editName && editName !== pageQuery.data?.name) {
                updatePage.mutate({ name: editName });
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {updatePage.isPending ? 'Saving…' : 'Saved'}
          </span>
          <button
            onClick={() => {
              if (confirm('Delete this page?')) deletePage.mutate();
            }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </header>

      {/* Block canvas */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        {displayBlocks.length === 0 && (
          <p className="text-gray-300 text-center py-12">
            Empty page. Add a block below.
          </p>
        )}

        <div className="space-y-4">
          {displayBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              onUpdate={(props) => updateBlock(block.id, props)}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </div>

        {/* Add block bar */}
        <div className="mt-6 flex items-center gap-2 justify-center">
          <span className="text-xs text-gray-400">Add:</span>
          {['heading', 'text', 'columns'].map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="px-3 py-1 text-xs border rounded-md hover:bg-gray-50"
            >
              {type}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
