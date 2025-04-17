import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { RegistryClientFactory } from '@apicurio/apicurio-registry-sdk';

const registryClient = RegistryClientFactory.createRegistryClient('http://localhost:8080/apis/registry/v3');

interface CreateSchemaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSchemaCreated: () => void; // Callback to refresh the schema list after creation
}

const CreateSchemaDialog: React.FC<CreateSchemaDialogProps> = ({ isOpen, onClose, onSchemaCreated }) => {
    const [newModelName, setNewModelName] = useState('');
    const [newModelDescription, setNewModelDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCreateModel = async () => {
        setIsSubmitting(true);
        try {
            const createdSchema = await registryClient.groups.byGroupId('default').artifacts.post({
                name: newModelName,
                artifactId: newModelName,
                description: newModelDescription,
                firstVersion: {
                    version: '1.0.0',
                    content: {
                        content: JSON.stringify({
                            type: 'object',
                            title: newModelName,
                            description: newModelDescription,
                            properties: {},
                        }),
                        contentType: 'application/json',
                    },
                },
            });

            // Navigate to the newly created schema's page
            navigate(`/schema/${createdSchema?.version?.globalId}`);
            onSchemaCreated(); // Trigger callback to refresh schema list
            onClose(); // Close the dialog
        } catch (error) {
            console.error('Error creating schema:', error);
            setError('Failed to create schema.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Schema</DialogTitle>
                </DialogHeader>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Enter schema name"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                        value={newModelDescription}
                        onChange={(e) => setNewModelDescription(e.target.value)}
                        placeholder="Enter schema description"
                        disabled={isSubmitting}
                    />
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateModel} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSchemaDialog;