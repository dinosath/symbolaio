use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::graphql::types::{Service, WidgetDefinition};

#[derive(Clone)]
pub struct ServiceRegistry {
    pool: PgPool,
}

#[derive(sqlx::FromRow)]
struct ServiceRow {
    id: Uuid,
    workspace_id: Uuid,
    name: String,
    endpoint_grpc: Option<String>,
    endpoint_rest: Option<String>,
    capabilities: serde_json::Value,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(sqlx::FromRow)]
struct WidgetRow {
    id: Uuid,
    service_id: Uuid,
    name: String,
    widget_type: String,
    bundle_url: Option<String>,
    config_schema: serde_json::Value,
}

impl ServiceRegistry {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_services(&self, workspace_id: Uuid) -> Result<Vec<Service>> {
        let rows = sqlx::query_as::<_, ServiceRow>(
            "SELECT id, workspace_id, name, endpoint_grpc, endpoint_rest, capabilities, status, created_at FROM services WHERE workspace_id = $1 ORDER BY name",
        )
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| Service {
                id: r.id.to_string().into(),
                workspace_id: r.workspace_id.to_string().into(),
                name: r.name,
                endpoint_grpc: r.endpoint_grpc,
                endpoint_rest: r.endpoint_rest,
                capabilities: r.capabilities,
                status: r.status,
                created_at: r.created_at.to_rfc3339(),
            })
            .collect())
    }

    pub async fn list_widgets(&self, workspace_id: Uuid) -> Result<Vec<WidgetDefinition>> {
        let rows = sqlx::query_as::<_, WidgetRow>(
            r#"
            SELECT wr.id, wr.service_id, wr.name, wr.widget_type, wr.bundle_url, wr.config_schema
            FROM widget_registry wr
            JOIN services s ON wr.service_id = s.id
            WHERE s.workspace_id = $1
            ORDER BY wr.name
            "#,
        )
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| WidgetDefinition {
                id: r.id.to_string().into(),
                service_id: r.service_id.to_string().into(),
                name: r.name,
                widget_type: r.widget_type,
                bundle_url: r.bundle_url,
                config_schema: r.config_schema,
            })
            .collect())
    }
}
