import type { Block } from '../types';

interface BlockRendererProps {
  block: Block;
  onUpdate: (props: Record<string, unknown>) => void;
  onRemove: () => void;
}

export default function BlockRenderer({
  block,
  onUpdate,
  onRemove,
}: BlockRendererProps) {
  switch (block.type) {
    case 'heading':
      return (
        <HeadingBlock block={block} onUpdate={onUpdate} onRemove={onRemove} />
      );
    case 'text':
      return (
        <TextBlock block={block} onUpdate={onUpdate} onRemove={onRemove} />
      );
    case 'columns':
      return <ColumnsBlock block={block} onRemove={onRemove} />;
    case 'service-widget':
      return <ServiceWidgetBlock block={block} onRemove={onRemove} />;
    default:
      return (
        <div className="p-3 border rounded-md bg-gray-50 text-sm text-gray-500">
          Unknown block type: <code>{block.type}</code>
          <button
            onClick={onRemove}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      );
  }
}

function HeadingBlock({
  block,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onUpdate: (props: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const level = (block.props.level as number) || 2;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClass =
    level === 1
      ? 'text-3xl'
      : level === 2
        ? 'text-2xl'
        : 'text-xl';

  return (
    <div className="group relative">
      <Tag
        className={`${sizeClass} font-bold outline-none`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) =>
          onUpdate({ text: (e.target as HTMLElement).textContent ?? '' })
        }
      >
        {(block.props.text as string) || ''}
      </Tag>
      <button
        onClick={onRemove}
        className="absolute top-0 right-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}

function TextBlock({
  block,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onUpdate: (props: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative">
      <p
        className="outline-none leading-relaxed"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) =>
          onUpdate({
            content: (e.target as HTMLElement).textContent ?? '',
          })
        }
      >
        {(block.props.content as string) || ''}
      </p>
      <button
        onClick={onRemove}
        className="absolute top-0 right-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}

function ColumnsBlock({
  block,
  onRemove,
}: {
  block: Block;
  onRemove: () => void;
}) {
  const cols = (block.props.columns as number) || 2;
  return (
    <div className="group relative">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] border-2 border-dashed border-gray-200 rounded-md p-3 text-center text-gray-300 text-sm"
          >
            Column {i + 1}
            {block.children
              ?.filter((_, idx) => idx % cols === i)
              .map((child) => (
                <BlockRenderer
                  key={child.id}
                  block={child}
                  onUpdate={() => {}}
                  onRemove={() => {}}
                />
              ))}
          </div>
        ))}
      </div>
      <button
        onClick={onRemove}
        className="absolute top-0 right-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}

function ServiceWidgetBlock({
  block,
  onRemove,
}: {
  block: Block;
  onRemove: () => void;
}) {
  return (
    <div className="group relative border rounded-lg p-4 bg-gray-50">
      <div className="text-xs text-gray-400 mb-1">
        Service Widget: <code>{block.widget}</code> from{' '}
        <code>{block.service}</code>
      </div>
      <div className="text-sm text-gray-500 italic">
        Widget rendered by service at runtime.
      </div>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}
