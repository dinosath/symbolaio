import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import RegistryService from "@/services/RegistryService";

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
        try {
            setIsSubmitting(true);
            const newSchemaResponse = await RegistryService.createNewJsonSchema(newModelName,newModelDescription);
            navigate(`/schemas/${newSchemaResponse?.version?.artifactId}`);
            onSchemaCreated();
            onClose();
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