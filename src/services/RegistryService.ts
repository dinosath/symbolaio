import { RegistryClientFactory } from "@apicurio/apicurio-registry-sdk";
import type { ArtifactMetaData, ArtifactSearchResults, CreateArtifactResponse, SearchedArtifact, VersionSearchResults } from "@apicurio/apicurio-registry-sdk/dist/generated-client/models";
import { JSONSchema7 } from 'json-schema';

class RegistryService {
    private client;

    constructor(baseUrl: string) {
        this.client = RegistryClientFactory.createRegistryClient(baseUrl);
    }

    // Fetch all JSON schemas
    async fetchSchemas(): Promise<SearchedArtifact[]> {
        try {
            const response = await this.client.search.artifacts.get();
            return response?.artifacts?.filter(
                (artifact) => artifact.artifactType === "JSON"
            ) || [];
        } catch (error) {
            console.error("Error fetching schemas:", error);
            throw error;
        }
    }

    async fetchArtifactMetadata(groupId: string, artifactId: string): Promise<ArtifactMetaData | undefined> {
        try {
            const response = await this.client.groups.byGroupId(groupId).artifacts.byArtifactId(artifactId).get();
            console.log("Fetched artifact metadata by groupId:", groupId, "and artifactId:", artifactId, "response:", response);
            return response;
        } catch (error) {
            console.error("Error fetching schema by ID:", error);
            throw error;
        }
    }

    async fetchArtifactVersions(groupId: string, artifactId: string): Promise<VersionSearchResults | undefined> {
        try {
            const response = await this.client.groups.byGroupId(groupId).artifacts.byArtifactId(artifactId).versions.get();
            console.log("Fetched artifact versions with groupId:", groupId, "and artifactId:", artifactId, "response:", response);
            return response;
        } catch (error) {
            console.error("Error fetching schema by ID:", error);
            throw error;
        }
    }

    async fetchContent(groupId: string, artifactId: string, version: string): Promise<ArrayBuffer | undefined> {
        try {
            const response = await this.client.groups.byGroupId(groupId).artifacts.byArtifactId(artifactId).versions.byVersionExpression(version).content.get();
            console.log("Fetched artifact content with groupId:", groupId, ", artifactId:", artifactId, "version:", version, "response:", response);
            return response;
        } catch (error) {
            console.error("Error fetching schema by ID:", error);
            throw error;
        }
    }

    async fetchJsonSchema(groupId: string, artifactId: string, version: string): Promise<JSONSchema7 | undefined> {
        try {
            const response = await this.fetchContent(groupId, artifactId, version);
            console.log("Fetched JSON schema with groupId:", groupId, ", artifactId:", artifactId, "version:", version, "response:", response);
            return JSON.parse(new TextDecoder().decode(response));
        } catch (error) {
            console.error("Error fetching JSON schema by grou", error);
            throw error;
        }
    }

    async createNewJsonSchema(artifactId: string, description:string): Promise<CreateArtifactResponse | undefined> {
        return this.createSchema('default', artifactId, description, {
            type: 'object',
            title: artifactId,
            description: "Newly created schema",
            properties: {},
        });
    }
    
    async createSchema(groupId: string, artifactId: string, description: string, schema: JSONSchema7): Promise<CreateArtifactResponse | undefined> {
        try {
            const createdSchema = await this.client.groups.byGroupId(groupId).artifacts.post({
                name: artifactId,
                artifactId: artifactId,
                description: description,
                firstVersion: {
                    version: '1.0.0',
                    content: {
                        content: JSON.stringify(schema),
                        contentType: 'application/json',
                    },
                },
            });
            return createdSchema
        } catch (error) {
            console.error("Error creating schema:", error);
            throw error;
        }
    }

    async updateSchema(groupId: string, artifactId: string, version: string, schema: JSONSchema7): Promise<void> {
        try {
            const response = await this.client.groups.byGroupId(groupId).artifacts.byArtifactId(artifactId).versions.post({
                content: {
                    content: JSON.stringify(schema),
                    contentType: 'application/json',
                },
                version: version,
            });
            console.log("Updated schema with groupId:", groupId, ", artifactId:", artifactId, "version:", version, "response:", response);
        } catch (error) {
            console.error("Error updating schema by ID:", error);
            throw error;
        }        
    }
}

export default new RegistryService("/apis/registry/v3");