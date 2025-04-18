import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { JSONSchema7 } from 'json-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import RegistryService from '@/services/RegistryService';
import { addFieldToSchema, compareJsonSchemas, incrementVersion, ChangeType } from '@/lib/utils';

const SchemaEditorPage: React.FC = () => {
    const { artifactId } = useParams<{ artifactId: string }>();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [schema, setSchema] = useState<JSONSchema7>({
        type: 'object',
        properties: {},
    }); // Holds the modified schema
    const [currentSchema, setCurrentSchema] = useState<JSONSchema7 | null>(null); // Holds the original schema
    const [versions, setVersions] = useState<string[]>([]); // List of artifact versions
    const [selectedVersion, setSelectedVersion] = useState<string>(''); // Selected version
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('string');

    // Load artifact versions and metadata
    useEffect(() => {
        const loadArtifactVersions = async () => {
            if (artifactId) {
                setName(artifactId);
                try {
                    const metadataResponse = await RegistryService.fetchArtifactMetadata('default', artifactId);
                    setDescription(metadataResponse?.description || '');
                } catch (error) {
                    console.error('Error fetching artifact metadata:', error);
                }

                try {
                    const versionsResponse = await RegistryService.fetchArtifactVersions('default', artifactId);
                    const versionList = versionsResponse?.versions
                        ?.filter((x) => x.artifactType === 'JSON')
                        .map((x) => x.version) || [];
                    console.log('Fetched versions:', versionList);
                    setVersions(versionList || []);
                    if (versionList.length > 0) {
                        setSelectedVersion(versionList[0]); // Default to the first version
                    }
                } catch (error) {
                    console.error('Error fetching artifact versions:', error);
                }
            }
        };

        loadArtifactVersions();
    }, [artifactId]);

    // Load schema for the selected version
    useEffect(() => {
        const loadSchemaForVersion = async () => {
            if (artifactId && selectedVersion) {
                try {
                    const loadedSchema = await RegistryService.fetchJsonSchema('default', artifactId, selectedVersion);
                    console.log('Loaded schema for version:', selectedVersion, loadedSchema);
                    const deepCopiedSchema = JSON.parse(JSON.stringify(loadedSchema));
                    setCurrentSchema(deepCopiedSchema); // Save the original schema
                    setSchema(loadedSchema); // Initialize the editable schema
                    setName(loadedSchema.title || '');
                    setDescription(loadedSchema.description || '');
                } catch (error) {
                    console.error('Error loading schema for version:', error);
                }
            }
        };

        loadSchemaForVersion();
    }, [artifactId, selectedVersion]);

    const handleSaveField = () => {
        if (!newFieldName.trim()) return;

        // Use the utility function to add the new field to the schema
        const updatedSchema = addFieldToSchema(schema, newFieldName, newFieldType);

        setSchema(updatedSchema); // Update the schema state
        setNewFieldName(''); // Reset the field name input
        setNewFieldType('string'); // Reset the field type input
        setIsModalOpen(false); // Close the modal
    };

    const handleSaveModel = async () => {
        const modelData = { ...schema, title: name, description };

        try {
            if (artifactId && currentSchema) {
                // Compare the current schema with the new schema
                const changeType: ChangeType = compareJsonSchemas(currentSchema, schema);

                // Determine the new version
                const currentVersion = selectedVersion || "1.0.0";
                const newVersion = incrementVersion(currentVersion, changeType);

                console.log("current schema:", currentSchema);
                console.log("new schema:", schema);
                console.log("Current Version:", currentVersion);
                console.log("Change Type:", changeType);
                console.log("New Version:", newVersion);

                // Save the new schema with the new version
                await RegistryService.updateSchema('default', artifactId, newVersion, schema);
                console.log(`Schema updated to version ${newVersion}`);
            } else {
                // Create a new schema if no artifactId exists
                await RegistryService.createSchema('default', name, description, modelData);
                console.log("New schema created");
            }
        } catch (error) {
            console.error('Error saving schema:', error);
        }
    };

    return (
        <div className="p-6 bg-white rounded shadow-md max-w-4xl mx-auto">
            {/* Breadcrumbs and Save Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                    <Breadcrumb className="flex items-center space-x-2">
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">{artifactId || 'New Schema'}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </Breadcrumb>
                </div>

                <div className="flex items-center space-x-4">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select Version" />
                        </SelectTrigger>
                        <SelectContent>
                            {versions.map((version) => (
                                <SelectItem key={version} value={version}>
                                    {version}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSaveModel} className="self-start sm:self-auto">
                        Save Changes
                    </Button>
                </div>
            </div>

            <h2 className="text-lg font-bold mb-4">{name || 'Untitled Schema'}</h2>

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
                            placeholder="Enter schema name"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter schema description"
                        />
                    </div>
                </TabsContent>

                {/* Fields Tab */}
                <TabsContent value="fields">
                    <div className="mb-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Field Name</TableHead>
                                    <TableHead>Field Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schema.properties &&
                                    Object.entries(schema.properties).map(([fieldName, fieldSchema]) => (
                                        <TableRow key={fieldName}>
                                            <TableCell>{fieldName}</TableCell>
                                            <TableCell>{(fieldSchema as JSONSchema7).type}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                        <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                            Add Field
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

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