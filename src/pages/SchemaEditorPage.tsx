import React, { useState } from 'react';
import { JSONSchema7 } from 'json-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ModelEditorProps {
    modelId?: string; // Optional for editing an existing model
    onSave: () => void; // Callback after saving
}

const SchemaEditorPage: React.FC<ModelEditorProps> = ({ modelId, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [schema, setSchema] = useState<JSONSchema7>({
        type: 'object',
        properties: {},
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('string');

    const handleSaveField = () => {
        if (!newFieldName.trim()) return;

        const updatedSchema = { ...schema };
        if (!updatedSchema.properties) updatedSchema.properties = {};
        updatedSchema.properties[newFieldName] = { type: newFieldType };

        setSchema(updatedSchema);
        setNewFieldName('');
        setNewFieldType('string');
        setIsModalOpen(false);
    };

    const handleSaveModel = async () => {
        const modelData = { name, description, schema };
        if (modelId) {
            // Update model logic
        } else {
            // Create model logic
        }
        onSave();
    };

    return (
        <div className="p-6 bg-white rounded shadow-md max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-4">{modelId ? 'Edit Model' : 'Create Model'}</h2>
            <Tabs defaultValue="general">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General Information</TabsTrigger>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                </TabsList>

                {/* General Information Tab */}
                <TabsContent value="general">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter model name"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter model description"
                        />
                    </div>
                </TabsContent>

                {/* Fields Tab */}
                <TabsContent value="fields">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Fields</label>
                        <ul className="space-y-2">
                            {schema.properties &&
                                Object.entries(schema.properties).map(([fieldName, fieldSchema]) => (
                                    <li
                                        key={fieldName}
                                        className="flex justify-between items-center bg-gray-100 p-2 rounded"
                                    >
                                        <span>
                                            {fieldName} ({(fieldSchema as JSONSchema7).type})
                                        </span>
                                    </li>
                                ))}
                        </ul>
                        <Button className="mt-2" onClick={() => setIsModalOpen(true)}>
                            Add Field
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            <Button onClick={handleSaveModel} className="mt-4">
                {modelId ? 'Update Model' : 'Create Model'}
            </Button>

            {/* Modal for Adding New Field */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Field</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Field Name</label>
                        <Input
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            placeholder="Enter field name"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Field Type</label>
                        <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="integer">Integer</option>
                            <option value="uuid">UUID</option>
                            <option value="email">Email</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveField}>Save Field</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SchemaEditorPage;