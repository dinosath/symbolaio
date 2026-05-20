use std::sync::Arc;

use anyhow::Result;
use futures::StreamExt;
use kube::{
    api::{Api, Patch, PatchParams},
    runtime::controller::{Action, Controller},
    Client, ResourceExt,
};
use sqlx::PgPool;
use tokio::time::Duration;

use crate::crd::{SymbolaioService, SymbolaioServiceStatus};
use crate::spec_parser;

#[derive(Debug, thiserror::Error)]
pub enum ReconcileError {
    #[error("Kubernetes error: {0}")]
    Kube(#[from] kube::Error),
    #[error("{0}")]
    Other(#[from] anyhow::Error),
}

struct Ctx {
    pool: PgPool,
    http: reqwest::Client,
}

pub async fn run(client: Client, pool: PgPool) -> Result<()> {
    let api: Api<SymbolaioService> = Api::all(client.clone());

    let ctx = Arc::new(Ctx {
        pool,
        http: reqwest::Client::new(),
    });

    Controller::new(api.clone(), Default::default())
        .run(reconcile, error_policy, ctx)
        .for_each(|res| async move {
            match res {
                Ok(o) => tracing::debug!("Reconciled: {:?}", o),
                Err(e) => tracing::error!("Reconcile error: {:?}", e),
            }
        })
        .await;

    Ok(())
}

async fn reconcile(
    svc: Arc<SymbolaioService>,
    ctx: Arc<Ctx>,
) -> Result<Action, ReconcileError> {
    let name = svc.name_any();
    let ns = svc.namespace().unwrap_or_default();
    tracing::info!(name = %name, namespace = %ns, "Reconciling SymbolaioService");

    let spec = &svc.spec;

    // Parse workspace_id
    let workspace_id: uuid::Uuid = spec
        .workspace_id
        .parse()
        .map_err(|e| anyhow::anyhow!("Invalid workspace_id: {e}"))?;

    // Upsert service into registry
    let service_id = upsert_service(&ctx.pool, workspace_id, &name, spec).await?;

    // Parse and store API specs
    if let Some(openapi_url) = &spec.specs.openapi {
        match spec_parser::fetch_and_store_openapi(&ctx.http, &ctx.pool, service_id, openapi_url).await {
            Ok(_) => tracing::info!("Stored OpenAPI spec for {name}"),
            Err(e) => tracing::warn!("Failed to fetch OpenAPI for {name}: {e}"),
        }
    }

    if let Some(asyncapi_url) = &spec.specs.asyncapi {
        match spec_parser::fetch_and_store_asyncapi(&ctx.http, &ctx.pool, service_id, asyncapi_url).await {
            Ok(_) => tracing::info!("Stored AsyncAPI spec for {name}"),
            Err(e) => tracing::warn!("Failed to fetch AsyncAPI for {name}: {e}"),
        }
    }

    // Register widgets
    for widget in &spec.widgets {
        register_widget(&ctx.pool, service_id, widget).await?;
    }

    // Register object schemas
    for obj in &spec.objects {
        register_object(&ctx.pool, workspace_id, service_id, obj).await?;
    }

    tracing::info!(name = %name, service_id = %service_id, "Service registered successfully");

    Ok(Action::requeue(Duration::from_secs(300)))
}

fn error_policy(
    _svc: Arc<SymbolaioService>,
    err: &ReconcileError,
    _ctx: Arc<Ctx>,
) -> Action {
    tracing::error!("Error: {:?}", err);
    Action::requeue(Duration::from_secs(60))
}

async fn upsert_service(
    pool: &PgPool,
    workspace_id: uuid::Uuid,
    name: &str,
    spec: &crate::crd::SymbolaioServiceSpec,
) -> Result<uuid::Uuid> {
    let capabilities = serde_json::to_value(&spec.capabilities)?;

    let row: (uuid::Uuid,) = sqlx::query_as(
        r#"
        INSERT INTO services (workspace_id, name, endpoint_grpc, endpoint_rest, capabilities)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (workspace_id, name) DO UPDATE SET
            endpoint_grpc = EXCLUDED.endpoint_grpc,
            endpoint_rest = EXCLUDED.endpoint_rest,
            capabilities = EXCLUDED.capabilities
        RETURNING id
        "#,
    )
    .bind(workspace_id)
    .bind(name)
    .bind(&spec.endpoints.grpc)
    .bind(&spec.endpoints.rest)
    .bind(&capabilities)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}

async fn register_widget(
    pool: &PgPool,
    service_id: uuid::Uuid,
    widget: &crate::crd::WidgetSpec,
) -> Result<()> {
    let config_schema = serde_json::to_value(&widget.config_schema)?;

    sqlx::query(
        r#"
        INSERT INTO widget_registry (service_id, name, widget_type, bundle_url, config_schema)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        "#,
    )
    .bind(service_id)
    .bind(&widget.name)
    .bind(&widget.widget_type)
    .bind(&widget.bundle)
    .bind(&config_schema)
    .execute(pool)
    .await?;

    Ok(())
}

async fn register_object(
    pool: &PgPool,
    workspace_id: uuid::Uuid,
    service_id: uuid::Uuid,
    obj: &crate::crd::ObjectSpec,
) -> Result<()> {
    sqlx::query(
        r#"
        INSERT INTO object_schemas (workspace_id, service_id, name, attributes, capabilities)
        VALUES ($1, $2, $3, $4, '[]')
        ON CONFLICT (workspace_id, name) DO UPDATE SET
            attributes = EXCLUDED.attributes,
            service_id = EXCLUDED.service_id,
            updated_at = now()
        "#,
    )
    .bind(workspace_id)
    .bind(service_id)
    .bind(&obj.name)
    .bind(&obj.schema)
    .execute(pool)
    .await?;

    Ok(())
}
