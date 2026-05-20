pub mod auth;
pub mod config;
pub mod graphql;
pub mod rest;
pub mod service_registry;

use anyhow::Result;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::config::AppConfig;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let config = AppConfig::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await?;

    let identity_client = connect_identity(&config.identity_grpc_addr).await?;

    let schema = graphql::build_schema(pool.clone(), identity_client);

    let app = Router::new()
        .merge(graphql::routes(schema))
        .merge(rest::routes(pool.clone()))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(&config.gateway_addr).await?;
    tracing::info!("Gateway listening on {}", config.gateway_addr);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn connect_identity(
    addr: &str,
) -> Result<symbolaio_proto::identity::identity_service_client::IdentityServiceClient<tonic::transport::Channel>>
{
    use symbolaio_proto::identity::identity_service_client::IdentityServiceClient;

    // Retry connection a few times (identity service might still be starting)
    let mut attempts = 0;
    loop {
        match IdentityServiceClient::connect(addr.to_string()).await {
            Ok(client) => {
                tracing::info!("Connected to identity service at {addr}");
                return Ok(client);
            }
            Err(e) => {
                attempts += 1;
                if attempts >= 10 {
                    return Err(anyhow::anyhow!(
                        "Failed to connect to identity service at {addr}: {e}"
                    ));
                }
                tracing::warn!("Identity service not ready, retrying in 2s... ({attempts}/10)");
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            }
        }
    }
}
