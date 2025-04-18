import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { SearchedArtifact } from "@apicurio/apicurio-registry-sdk/dist/generated-client/models";
import CreateSchemaDialog from "@/components/CreateSchemaDialog";
import RegistryService from "@/services/RegistryService";
import { renderDateWithTooltip } from '@/lib/dateUtils';

const SchemaListPage: React.FC = () => {
    const [schemas, setSchemas] = useState<SearchedArtifact[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const loadSchemas = async () => {
        try {
            const jsonSchemas = await RegistryService.fetchSchemas();
            setSchemas(jsonSchemas);
        } catch (error) {
            console.error("Error loading schemas:", error);
        }
    };

    useEffect(() => {
        loadSchemas();
    }, []);

    const columns: ColumnDef<SearchedArtifact>[] = [
        {
            accessorKey: "artifactId",
            header: "Id",
        },
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "description",
            header: "Description",
        },
        {
            accessorKey: "createdOn",
            header: "Created Date",
            cell: ({ row }) => renderDateWithTooltip(row.original.createdOn),
    
        },
{
            accessorKey: "owner",
            header: "Owner",
        },
        {
            accessorKey: "modifiedOn",
            header: "Modified Date",
            cell: ({ row }) => renderDateWithTooltip(row.original.modifiedOn),

        },
        {
            accessorKey: "modifiedBy",
            header: "Modified by",
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/schemas/${row.original?.artifactId}`)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={async () => {
                                try {
                                    if (row.original?.artifactId) {
                                        await RegistryService.deleteSchema("default", row.original.artifactId);
                                    } else {
                                        console.error("Artifact ID is missing or invalid.");
                                    }
                                    loadSchemas();
                                } catch (error) {
                                    console.error("Error deleting schema:", error);
                                }
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="p-6 flex flex-col items-center w-full">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Schemas</h1>
                    <Button onClick={() => setIsModalOpen(true)}>+ Create Schema</Button>
                </div>

                <DataTable columns={columns} data={schemas} />
            </div>
            <CreateSchemaDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSchemaCreated={loadSchemas}
            />
        </div>
    );
};

export default SchemaListPage;
