use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

/// Fetch an OpenAPI spec from a URL and store it in the services table.
pub async fn fetch_and_store_openapi(
    http: &reqwest::Client,
    pool: &PgPool,
    service_id: Uuid,
    url: &str,
) -> Result<()> {
    let resp = http.get(url).send().await?;
    let body = resp.text().await?;

    // Validate it's valid JSON and parseable as OpenAPI
    let spec: serde_json::Value = serde_json::from_str(&body)?;

    // Optionally validate with openapiv3
    if let Ok(openapi) = serde_json::from_value::<openapiv3::OpenAPI>(spec.clone()) {
        tracing::info!(
            title = %openapi.info.title,
            version = %openapi.info.version,
            "Parsed OpenAPI spec"
        );
    }

    sqlx::query("UPDATE services SET spec_openapi = $1 WHERE id = $2")
        .bind(&spec)
        .bind(service_id)
        .execute(pool)
        .await?;

    Ok(())
}

/// Fetch an AsyncAPI spec from a URL and store it in the services table.
pub async fn fetch_and_store_asyncapi(
    http: &reqwest::Client,
    pool: &PgPool,
    service_id: Uuid,
    url: &str,
) -> Result<()> {
    let resp = http.get(url).send().await?;
    let body = resp.text().await?;

    let spec: serde_json::Value = serde_json::from_str(&body)?;

    // Basic validation: check it has asyncapi version field
    if let Some(version) = spec.get("asyncapi").and_then(|v| v.as_str()) {
        tracing::info!(asyncapi_version = %version, "Parsed AsyncAPI spec");
    }

    sqlx::query("UPDATE services SET spec_asyncapi = $1 WHERE id = $2")
        .bind(&spec)
        .bind(service_id)
        .execute(pool)
        .await?;

    Ok(())
}
