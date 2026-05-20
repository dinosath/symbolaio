use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Page {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub name: String,
    pub icon: Option<String>,
    pub cover_url: Option<String>,
    pub blocks: serde_json::Value,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Input for creating a new page.
#[derive(Debug, Deserialize)]
pub struct CreatePage {
    pub workspace_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub name: String,
    pub icon: Option<String>,
    pub blocks: serde_json::Value,
    pub created_by: Option<Uuid>,
}

/// Input for updating an existing page.
#[derive(Debug, Deserialize)]
pub struct UpdatePage {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub blocks: Option<serde_json::Value>,
}

/// Block structure for validation / typed access.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    #[serde(rename = "type")]
    pub block_type: String,
    #[serde(default)]
    pub props: serde_json::Value,
    #[serde(default)]
    pub children: Vec<Block>,
    /// For service-widget blocks
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service: Option<String>,
    /// Widget name from the service's widget registry
    #[serde(skip_serializing_if = "Option::is_none")]
    pub widget: Option<String>,
}
