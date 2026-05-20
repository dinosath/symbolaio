use async_graphql::{InputObject, SimpleObject, ID};
use serde_json::Value as JsonValue;

// ── Page types ─────────────────────────────────

#[derive(SimpleObject)]
pub struct Page {
    pub id: ID,
    pub workspace_id: ID,
    pub parent_id: Option<ID>,
    pub name: String,
    pub icon: Option<String>,
    pub cover_url: Option<String>,
    pub blocks: JsonValue,
    pub created_by: Option<ID>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(InputObject)]
pub struct CreatePageInput {
    pub workspace_id: ID,
    pub parent_id: Option<ID>,
    pub name: String,
    pub icon: Option<String>,
    pub blocks: JsonValue,
}

#[derive(InputObject)]
pub struct UpdatePageInput {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub blocks: Option<JsonValue>,
}

// ── Object types ───────────────────────────────

#[derive(SimpleObject)]
pub struct ObjectSchema {
    pub id: ID,
    pub workspace_id: ID,
    pub service_id: Option<ID>,
    pub name: String,
    pub attributes: JsonValue,
    pub capabilities: JsonValue,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(InputObject)]
pub struct CreateObjectSchemaInput {
    pub workspace_id: ID,
    pub name: String,
    pub attributes: JsonValue,
    pub capabilities: Option<JsonValue>,
}

// ── Record types ───────────────────────────────

#[derive(SimpleObject)]
pub struct Record {
    pub id: ID,
    pub workspace_id: ID,
    pub object_id: ID,
    pub data: JsonValue,
    pub created_by: Option<ID>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(InputObject)]
pub struct CreateRecordInput {
    pub workspace_id: ID,
    pub object_id: ID,
    pub data: JsonValue,
}

#[derive(InputObject)]
pub struct UpdateRecordInput {
    pub data: JsonValue,
}

// ── Service registry types ─────────────────────

#[derive(SimpleObject)]
pub struct Service {
    pub id: ID,
    pub workspace_id: ID,
    pub name: String,
    pub endpoint_grpc: Option<String>,
    pub endpoint_rest: Option<String>,
    pub capabilities: JsonValue,
    pub status: String,
    pub created_at: String,
}

#[derive(SimpleObject)]
pub struct WidgetDefinition {
    pub id: ID,
    pub service_id: ID,
    pub name: String,
    pub widget_type: String,
    pub bundle_url: Option<String>,
    pub config_schema: JsonValue,
}

// ── Auth types ─────────────────────────────────

#[derive(SimpleObject)]
pub struct AuthPayload {
    pub access_token: String,
    pub user_id: ID,
}

#[derive(SimpleObject)]
pub struct User {
    pub id: ID,
    pub email: String,
    pub display_name: String,
    pub created_at: String,
}

#[derive(InputObject)]
pub struct RegisterInput {
    pub email: String,
    pub password: String,
    pub display_name: String,
}

#[derive(InputObject)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(SimpleObject)]
pub struct Workspace {
    pub id: ID,
    pub name: String,
    pub owner_id: ID,
    pub created_at: String,
}

// ── Conversions ────────────────────────────────

impl From<symbolaio_page_engine::Page> for Page {
    fn from(p: symbolaio_page_engine::Page) -> Self {
        Self {
            id: p.id.to_string().into(),
            workspace_id: p.workspace_id.to_string().into(),
            parent_id: p.parent_id.map(|id| id.to_string().into()),
            name: p.name,
            icon: p.icon,
            cover_url: p.cover_url,
            blocks: p.blocks,
            created_by: p.created_by.map(|id| id.to_string().into()),
            created_at: p.created_at.to_rfc3339(),
            updated_at: p.updated_at.to_rfc3339(),
        }
    }
}

impl From<symbolaio_object_engine::ObjectSchema> for ObjectSchema {
    fn from(o: symbolaio_object_engine::ObjectSchema) -> Self {
        Self {
            id: o.id.to_string().into(),
            workspace_id: o.workspace_id.to_string().into(),
            service_id: o.service_id.map(|id| id.to_string().into()),
            name: o.name,
            attributes: o.attributes,
            capabilities: o.capabilities,
            created_at: o.created_at.to_rfc3339(),
            updated_at: o.updated_at.to_rfc3339(),
        }
    }
}

impl From<symbolaio_object_engine::Record> for Record {
    fn from(r: symbolaio_object_engine::Record) -> Self {
        Self {
            id: r.id.to_string().into(),
            workspace_id: r.workspace_id.to_string().into(),
            object_id: r.object_id.to_string().into(),
            data: r.data,
            created_by: r.created_by.map(|id| id.to_string().into()),
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }
    }
}
