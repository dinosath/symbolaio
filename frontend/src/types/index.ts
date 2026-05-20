export interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: Block[];
  // For service-widget blocks
  service?: string;
  widget?: string;
}

export interface Page {
  id: string;
  name: string;
  workspaceId: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export interface Attribute {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
}

export interface ObjectSchema {
  id: string;
  name: string;
  workspaceId: string;
  attributes: Attribute[];
}

export interface Record {
  id: string;
  objectId: string;
  workspaceId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  baseUrl: string;
  capabilities: string[];
}

export interface WidgetDefinition {
  widgetType: string;
  serviceName: string;
  configSchema: Record<string, unknown>;
  description: string;
}

export interface AuthPayload {
  accessToken: string;
  userId: string;
}
