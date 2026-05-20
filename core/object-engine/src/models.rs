use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// An Attio-style custom object schema.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ObjectSchema {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub service_id: Option<Uuid>,
    pub name: String,
    pub attributes: serde_json::Value,
    pub capabilities: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateObjectSchema {
    pub workspace_id: Uuid,
    pub service_id: Option<Uuid>,
    pub name: String,
    pub attributes: serde_json::Value,
    pub capabilities: serde_json::Value,
}

/// Attribute type definition within an object schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attribute {
    pub name: String,
    #[serde(rename = "type")]
    pub attr_type: AttributeType,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub config: serde_json::Value,
    /// For select/multi_select
    #[serde(default)]
    pub options: Vec<String>,
    /// For relation type
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AttributeType {
    Text,
    Number,
    Currency,
    Date,
    Datetime,
    Boolean,
    Select,
    MultiSelect,
    Relation,
    Email,
    Url,
    Json,
    File,
}

/// A data record belonging to an object schema.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Record {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub object_id: Uuid,
    pub data: serde_json::Value,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecord {
    pub workspace_id: Uuid,
    pub object_id: Uuid,
    pub data: serde_json::Value,
    pub created_by: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRecord {
    pub data: serde_json::Value,
}
