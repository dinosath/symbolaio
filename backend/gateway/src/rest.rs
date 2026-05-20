use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use sqlx::PgPool;

pub fn routes(pool: PgPool) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/readyz", get(readiness))
        .route("/api/v1/webhooks/{provider}", post(webhook_receiver))
        .with_state(pool)
}

async fn health() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

async fn readiness(State(pool): State<PgPool>) -> impl IntoResponse {
    match sqlx::query("SELECT 1").execute(&pool).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "status": "ready" }))),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "not ready" })),
        ),
    }
}

async fn webhook_receiver(
    axum::extract::Path(provider): axum::extract::Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    tracing::info!(provider = %provider, "Received webhook");
    tracing::debug!(payload = %payload, "Webhook payload");

    // TODO: normalize payload, publish to NATS
    (
        StatusCode::ACCEPTED,
        Json(json!({ "status": "accepted", "provider": provider })),
    )
}
