import { useState } from 'react';
import type { ObjectSchema, Record as RecordType } from '../types';

interface ObjectTableProps {
  schema: ObjectSchema;
  records: RecordType[];
  isLoading: boolean;
  onCreateRecord: (data: Record<string, unknown>) => void;
  onDeleteRecord: (id: string) => void;
}

export default function ObjectTable({
  schema,
  records,
  isLoading,
  onCreateRecord,
  onDeleteRecord,
}: ObjectTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRecord(formData);
    setFormData({});
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{schema.name}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
        >
          + New Record
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 p-4 bg-white border rounded-lg space-y-3"
        >
          {schema.attributes.map((attr) => (
            <div key={attr.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.name}
                {attr.required && <span className="text-red-500">*</span>}
              </label>
              {attr.options && attr.options.length > 0 ? (
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData[attr.name] ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [attr.name]: e.target.value })
                  }
                  required={attr.required}
                >
                  <option value="">Select…</option>
                  {attr.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full px-3 py-2 border rounded-md"
                  type={attr.type === 'number' ? 'number' : 'text'}
                  value={formData[attr.name] ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [attr.name]: e.target.value })
                  }
                  required={attr.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-400">Loading records…</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400">No records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                {schema.attributes.map((attr) => (
                  <th
                    key={attr.name}
                    className="text-left px-3 py-2 font-medium text-gray-600"
                  >
                    {attr.name}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  {schema.attributes.map((attr) => (
                    <td key={attr.name} className="px-3 py-2">
                      {String(record.data[attr.name] ?? '')}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
