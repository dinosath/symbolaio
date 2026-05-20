mod controller;
mod crd;
mod spec_parser;

use anyhow::Result;
use kube::Client;
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://symbolaio:symbolaio@localhost:5432/symbolaio".into());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let kube_client = Client::try_default().await?;

    tracing::info!("Symbolaio operator starting");

    controller::run(kube_client, pool).await?;

    Ok(())
}
