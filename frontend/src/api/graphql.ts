import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../stores/auth';

const endpoint = '/graphql';

export function getClient(): GraphQLClient {
  const token = useAuthStore.getState().token;
  return new GraphQLClient(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── Auth ──

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { accessToken userId }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { accessToken userId }
  }
`;

export const ME_QUERY = `
  query Me { me { id email displayName } }
`;

// ── Workspaces ──

export const CREATE_WORKSPACE_MUTATION = `
  mutation CreateWorkspace($name: String!, $ownerId: ID!) {
    createWorkspace(name: $name, ownerId: $ownerId) { id name ownerId }
  }
`;

// ── Pages ──

export const PAGES_QUERY = `
  query Pages($workspaceId: ID!) {
    pages(workspaceId: $workspaceId) { id name updatedAt }
  }
`;

export const PAGE_QUERY = `
  query Page($id: ID!) {
    page(id: $id) { id name blocks workspaceId createdAt updatedAt }
  }
`;

export const CREATE_PAGE_MUTATION = `
  mutation CreatePage($input: CreatePageInput!) {
    createPage(input: $input) { id name blocks }
  }
`;

export const UPDATE_PAGE_MUTATION = `
  mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
    updatePage(id: $id, input: $input) { id name blocks }
  }
`;

export const DELETE_PAGE_MUTATION = `
  mutation DeletePage($id: ID!) {
    deletePage(id: $id)
  }
`;

// ── Objects ──

export const OBJECT_SCHEMAS_QUERY = `
  query ObjectSchemas($workspaceId: ID!) {
    objectSchemas(workspaceId: $workspaceId) { id name attributes }
  }
`;

export const CREATE_OBJECT_SCHEMA_MUTATION = `
  mutation CreateObjectSchema($input: CreateObjectSchemaInput!) {
    createObjectSchema(input: $input) { id name attributes }
  }
`;

export const RECORDS_QUERY = `
  query Records($objectId: ID!, $workspaceId: ID!) {
    records(objectId: $objectId, workspaceId: $workspaceId) { id data createdAt updatedAt }
  }
`;

export const CREATE_RECORD_MUTATION = `
  mutation CreateRecord($input: CreateRecordInput!) {
    createRecord(input: $input) { id data }
  }
`;

export const UPDATE_RECORD_MUTATION = `
  mutation UpdateRecord($id: ID!, $input: UpdateRecordInput!) {
    updateRecord(id: $id, input: $input) { id data }
  }
`;

export const DELETE_RECORD_MUTATION = `
  mutation DeleteRecord($id: ID!) {
    deleteRecord(id: $id)
  }
`;

// ── Services ──

export const SERVICES_QUERY = `
  query Services($workspaceId: ID!) {
    services(workspaceId: $workspaceId) { id name baseUrl capabilities }
  }
`;

export const AVAILABLE_WIDGETS_QUERY = `
  query AvailableWidgets($workspaceId: ID!) {
    availableWidgets(workspaceId: $workspaceId) {
      widgetType
      serviceName
      configSchema
      description
    }
  }
`;
