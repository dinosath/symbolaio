import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import {
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	ColumnDef,
} from "@tanstack/react-table";
import {
	ApicurioRegistryClient,
	RegistryClientFactory,
} from "@apicurio/apicurio-registry-sdk";
import type { SearchedArtifact } from "@apicurio/apicurio-registry-sdk/dist/generated-client/models";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react";
import CreateSchemaDialog from "@/components/CreateSchemaDialog";

const registryClient = RegistryClientFactory.createRegistryClient(
	"http://localhost:8080/apis/registry/v3",
);

const SchemaListPage: React.FC = () => {
	const [schemas, setSchemas] = useState<SearchedArtifact[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newModelName, setNewModelName] = useState("");
	const [newModelDescription, setNewModelDescription] = useState("");
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const loadSchemas = async () => {
		setIsLoading(true);
		registryClient.search.artifacts.get().then((response) => {
			const jsonSchemas =
				response?.artifacts?.filter(
					(artifact) => artifact.artifactType === "JSON",
				) || [];
			setSchemas(jsonSchemas);
			setIsLoading(false);
		});
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
		},
		{
			accessorKey: "owner",
			header: "Owner",
		},
		{
			accessorKey: "modifiedOn",
			header: "Modified Date",
		},
		{
			accessorKey: "modifiedBy",
			header: "Modified by",
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<Button
					variant="ghost"
					onClick={() => navigate(`/models/${row.original?.artifactId}`)}
				>
					Edit
				</Button>
			),
		},
	];

	// Create the table instance
	const table = useReactTable({
		data: schemas,
		columns,
		state: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className="p-6 flex flex-col items-center">
			<div className="w-full max-w-4xl">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Schemas</h1>
					<Button onClick={() => setIsModalOpen(true)}>
						+ Create Content Type
					</Button>
				</div>

				<div className="overflow-hidden rounded-lg border border-gray-200">
					<Table>
						<TableHeader>
							<TableRow>
								{table
									.getHeaderGroups()
									.map((headerGroup) =>
										headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: header.column.columnDef.header}
											</TableHead>
										)),
									)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center">
										Loading...
									</TableCell>
								</TableRow>
							) : error ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-red-500">
										{error}
									</TableCell>
								</TableRow>
							) : schemas.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-gray-500">
										No schemas found.
									</TableCell>
								</TableRow>
							) : (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{cell.getValue() instanceof Date
													? cell
															.getValue()
															.toLocaleDateString() // Format Date objects
													: cell.getValue() !== undefined
														? cell.getValue()
														: "N/A"}
											</TableCell>
										))}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				<div className="w-full flex items-center justify-between px-4 mt-4">
					{/* Row Count Label */}
					<div className="text-sm text-muted-foreground">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>

					{/* Pagination Controls */}
					<div className="flex items-center gap-2">
						<Label
							htmlFor="rows-per-page"
							className="text-sm font-medium hidden lg:block"
						>
							Rows per page
						</Label>
						<Select
							value={`${table.getState().pagination.pageSize}`}
							onValueChange={(value) => {
								table.setPageSize(Number(value));
							}}
						>
							<SelectTrigger className="w-20" id="rows-per-page">
								<SelectValue
									placeholder={table.getState().pagination.pageSize}
								/>
							</SelectTrigger>
							<SelectContent side="top">
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>

						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeftIcon />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon />
						</Button>
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRightIcon />
						</Button>
					</div>
				</div>
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
