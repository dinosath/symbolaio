/// Integration tests for the Symbolaio gateway.
///
/// These tests require PostgreSQL running on localhost:5432.
/// Start it with: `docker-compose up -d postgres`
/// Run migrations:  `psql $DATABASE_URL -f migrations/001_initial.sql`
///
/// Run: `cargo test --package symbolaio-gateway --test integration_test`

use reqwest::Client;
use serde_json::{json, Value};
use std::net::TcpListener;
use std::time::Duration;

/// Spawn the identity gRPC server and gateway HTTP server in background,
/// returning the gateway base URL.
async fn setup() -> (String, sqlx::PgPool) {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://symbolaio:symbolaio@localhost:5432/symbolaio".into());
    let jwt_secret = "test-secret".to_string();

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to PostgreSQL - is it running?");

    // Run migrations
    sqlx::query(include_str!("../../../migrations/001_initial.sql"))
        .execute(&pool)
        .await
        .expect("Failed to run migrations");

    // Find free ports
    let identity_port = free_port();
    let gateway_port = free_port();

    let identity_addr = format!("0.0.0.0:{identity_port}");
    let identity_grpc_url = format!("http://127.0.0.1:{identity_port}");

    // Start identity service
    let pool_clone = pool.clone();
    let secret_clone = jwt_secret.clone();
    let addr_clone = identity_addr.clone();
    tokio::spawn(async move {
        use symbolaio_proto::identity::identity_service_server::IdentityServiceServer;
        // We need to inline the identity service here since it's a separate binary
        // For tests, we re-implement the service start
        let svc = identity_service_impl(pool_clone, secret_clone);
        tonic::transport::Server::builder()
            .add_service(IdentityServiceServer::new(svc))
            .serve(addr_clone.parse().unwrap())
            .await
            .unwrap();
    });

    // Wait for identity service to be ready
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Build gateway
    std::env::set_var("JWT_SECRET", &jwt_secret);
    std::env::set_var("IDENTITY_GRPC_ADDR", &identity_grpc_url);

    let identity_client =
        symbolaio_proto::identity::identity_service_client::IdentityServiceClient::connect(
            identity_grpc_url,
        )
        .await
        .expect("Failed to connect to identity service");

    let schema = symbolaio_gateway::graphql::build_schema(pool.clone(), identity_client);

    let app = axum::Router::new()
        .merge(symbolaio_gateway::graphql::routes(schema))
        .merge(symbolaio_gateway::rest::routes(pool.clone()))
        .layer(tower_http::cors::CorsLayer::permissive());

    let gateway_addr = format!("0.0.0.0:{gateway_port}");
    let listener = tokio::net::TcpListener::bind(&gateway_addr).await.unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    tokio::time::sleep(Duration::from_millis(200)).await;

    let base_url = format!("http://127.0.0.1:{gateway_port}");
    (base_url, pool)
}

fn free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .unwrap()
        .local_addr()
        .unwrap()
        .port()
}

/// Minimal identity service implementation for testing.
/// This avoids depending on the identity binary crate.
struct TestIdentityService {
    pool: sqlx::PgPool,
    jwt_secret: String,
}

fn identity_service_impl(
    pool: sqlx::PgPool,
    jwt_secret: String,
) -> TestIdentityService {
    TestIdentityService { pool, jwt_secret }
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: uuid::Uuid,
    email: String,
    password_hash: String,
    display_name: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(sqlx::FromRow)]
struct WorkspaceRow {
    id: uuid::Uuid,
    name: String,
    owner_id: uuid::Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[tonic::async_trait]
impl symbolaio_proto::identity::identity_service_server::IdentityService
    for TestIdentityService
{
    async fn register(
        &self,
        request: tonic::Request<symbolaio_proto::identity::RegisterRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::AuthResponse>, tonic::Status> {
        let req = request.into_inner();
        let salt = argon2::password_hash::SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
        let hash = argon2::Argon2::default()
            .hash_password(req.password.as_bytes(), &salt)
            .map_err(|e| tonic::Status::internal(e.to_string()))?
            .to_string();

        let user = sqlx::query_as::<_, UserRow>(
            "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(&req.email)
        .bind(&hash)
        .bind(&req.display_name)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| tonic::Status::internal(e.to_string()))?;

        let token = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &serde_json::json!({"sub": user.id.to_string(), "email": user.email, "exp": chrono::Utc::now().timestamp() + 86400}),
            &jsonwebtoken::EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| tonic::Status::internal(e.to_string()))?;

        Ok(tonic::Response::new(symbolaio_proto::identity::AuthResponse {
            access_token: token,
            user_id: user.id.to_string(),
        }))
    }

    async fn login(
        &self,
        request: tonic::Request<symbolaio_proto::identity::LoginRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::AuthResponse>, tonic::Status> {
        let req = request.into_inner();
        let user = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE email = $1")
            .bind(&req.email)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| tonic::Status::internal(e.to_string()))?
            .ok_or_else(|| tonic::Status::unauthenticated("Invalid credentials"))?;

        let parsed = argon2::PasswordHash::new(&user.password_hash)
            .map_err(|e| tonic::Status::internal(e.to_string()))?;
        argon2::PasswordVerifier::verify_password(&argon2::Argon2::default(), req.password.as_bytes(), &parsed)
            .map_err(|_| tonic::Status::unauthenticated("Invalid credentials"))?;

        let token = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &serde_json::json!({"sub": user.id.to_string(), "email": user.email, "exp": chrono::Utc::now().timestamp() + 86400}),
            &jsonwebtoken::EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|e| tonic::Status::internal(e.to_string()))?;

        Ok(tonic::Response::new(symbolaio_proto::identity::AuthResponse {
            access_token: token,
            user_id: user.id.to_string(),
        }))
    }

    async fn validate_token(
        &self,
        request: tonic::Request<symbolaio_proto::identity::ValidateTokenRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::ValidateTokenResponse>, tonic::Status> {
        let req = request.into_inner();
        let result = jsonwebtoken::decode::<serde_json::Value>(
            &req.token,
            &jsonwebtoken::DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &jsonwebtoken::Validation::default(),
        );
        match result {
            Ok(data) => Ok(tonic::Response::new(symbolaio_proto::identity::ValidateTokenResponse {
                valid: true,
                user_id: data.claims["sub"].as_str().unwrap_or_default().to_string(),
                email: data.claims["email"].as_str().unwrap_or_default().to_string(),
            })),
            Err(_) => Ok(tonic::Response::new(symbolaio_proto::identity::ValidateTokenResponse {
                valid: false,
                user_id: String::new(),
                email: String::new(),
            })),
        }
    }

    async fn get_user(
        &self,
        request: tonic::Request<symbolaio_proto::identity::GetUserRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::User>, tonic::Status> {
        let id: uuid::Uuid = request.into_inner().id.parse().map_err(|_| tonic::Status::invalid_argument("bad id"))?;
        let user = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| tonic::Status::internal(e.to_string()))?
            .ok_or_else(|| tonic::Status::not_found("not found"))?;
        Ok(tonic::Response::new(symbolaio_proto::identity::User {
            id: user.id.to_string(),
            email: user.email,
            display_name: user.display_name,
            created_at: user.created_at.to_rfc3339(),
        }))
    }

    async fn create_workspace(
        &self,
        request: tonic::Request<symbolaio_proto::identity::CreateWorkspaceRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::Workspace>, tonic::Status> {
        let req = request.into_inner();
        let owner_id: uuid::Uuid = req.owner_id.parse().map_err(|_| tonic::Status::invalid_argument("bad owner_id"))?;
        let ws = sqlx::query_as::<_, WorkspaceRow>(
            "INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING *",
        )
        .bind(&req.name)
        .bind(owner_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| tonic::Status::internal(e.to_string()))?;
        sqlx::query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')")
            .bind(ws.id)
            .bind(owner_id)
            .execute(&self.pool)
            .await
            .map_err(|e| tonic::Status::internal(e.to_string()))?;
        Ok(tonic::Response::new(symbolaio_proto::identity::Workspace {
            id: ws.id.to_string(),
            name: ws.name,
            owner_id: ws.owner_id.to_string(),
            created_at: ws.created_at.to_rfc3339(),
        }))
    }

    async fn list_workspaces(
        &self,
        request: tonic::Request<symbolaio_proto::identity::ListWorkspacesRequest>,
    ) -> Result<tonic::Response<symbolaio_proto::identity::ListWorkspacesResponse>, tonic::Status> {
        let user_id: uuid::Uuid = request.into_inner().user_id.parse().map_err(|_| tonic::Status::invalid_argument("bad id"))?;
        let rows = sqlx::query_as::<_, WorkspaceRow>(
            "SELECT w.* FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1",
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| tonic::Status::internal(e.to_string()))?;
        Ok(tonic::Response::new(symbolaio_proto::identity::ListWorkspacesResponse {
            workspaces: rows.into_iter().map(|ws| symbolaio_proto::identity::Workspace {
                id: ws.id.to_string(),
                name: ws.name,
                owner_id: ws.owner_id.to_string(),
                created_at: ws.created_at.to_rfc3339(),
            }).collect(),
        }))
    }
}

// ── Helper ─────────────────────────────────────────────────

async fn graphql(client: &Client, url: &str, query: &str, variables: Value) -> Value {
    let resp = client
        .post(url)
        .json(&json!({ "query": query, "variables": variables }))
        .send()
        .await
        .expect("Request failed");

    resp.json::<Value>().await.expect("Invalid JSON response")
}

async fn cleanup(pool: &sqlx::PgPool) {
    // Clean up in reverse FK order
    sqlx::query("DELETE FROM records").execute(pool).await.ok();
    sqlx::query("DELETE FROM object_schemas").execute(pool).await.ok();
    sqlx::query("DELETE FROM widget_registry").execute(pool).await.ok();
    sqlx::query("DELETE FROM services").execute(pool).await.ok();
    sqlx::query("DELETE FROM pages").execute(pool).await.ok();
    sqlx::query("DELETE FROM workspace_members").execute(pool).await.ok();
    sqlx::query("DELETE FROM workspaces").execute(pool).await.ok();
    sqlx::query("DELETE FROM users").execute(pool).await.ok();
}

// ── Tests ──────────────────────────────────────────────────

#[tokio::test]
async fn test_health_check() {
    let (base, pool) = setup().await;
    cleanup(&pool).await;

    let client = Client::new();
    let resp = client
        .get(format!("{base}/healthz"))
        .send()
        .await
        .unwrap();

    assert_eq!(resp.status(), 200);
    let body: Value = resp.json().await.unwrap();
    assert_eq!(body["status"], "ok");
}

#[tokio::test]
async fn test_readiness_check() {
    let (base, pool) = setup().await;
    cleanup(&pool).await;

    let client = Client::new();
    let resp = client
        .get(format!("{base}/readyz"))
        .send()
        .await
        .unwrap();

    assert_eq!(resp.status(), 200);
}

#[tokio::test]
async fn test_full_flow() {
    let (base, pool) = setup().await;
    cleanup(&pool).await;

    let client = Client::new();
    let gql_url = format!("{base}/graphql");

    // 1. Register a user
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation Register($input: RegisterInput!) {
            register(input: $input) { accessToken userId }
        }"#,
        json!({
            "input": {
                "email": "test@symbolaio.dev",
                "password": "securepass123",
                "displayName": "Test User"
            }
        }),
    )
    .await;

    let token = result["data"]["register"]["accessToken"]
        .as_str()
        .expect("Should get access token");
    let user_id = result["data"]["register"]["userId"]
        .as_str()
        .expect("Should get user id");
    assert!(!token.is_empty());
    assert!(!user_id.is_empty());

    // 2. Login
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation Login($input: LoginInput!) {
            login(input: $input) { accessToken userId }
        }"#,
        json!({
            "input": {
                "email": "test@symbolaio.dev",
                "password": "securepass123"
            }
        }),
    )
    .await;

    assert!(result["data"]["login"]["accessToken"].as_str().is_some());

    // 3. Create workspace
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation CreateWorkspace($name: String!, $ownerId: ID!) {
            createWorkspace(name: $name, ownerId: $ownerId) { id name ownerId }
        }"#,
        json!({ "name": "Test Workspace", "ownerId": user_id }),
    )
    .await;

    let workspace_id = result["data"]["createWorkspace"]["id"]
        .as_str()
        .expect("Should get workspace id");

    // 4. Create a page with blocks
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation CreatePage($input: CreatePageInput!) {
            createPage(input: $input) { id name blocks }
        }"#,
        json!({
            "input": {
                "workspaceId": workspace_id,
                "name": "My Dashboard",
                "blocks": [
                    {
                        "id": "block-1",
                        "type": "heading",
                        "props": { "level": 1, "text": "Welcome" }
                    },
                    {
                        "id": "block-2",
                        "type": "text",
                        "props": { "content": "This is a dynamic page." }
                    }
                ]
            }
        }),
    )
    .await;

    let page_id = result["data"]["createPage"]["id"]
        .as_str()
        .expect("Should get page id");
    assert_eq!(result["data"]["createPage"]["name"], "My Dashboard");

    // 5. Get page
    let result = graphql(
        &client,
        &gql_url,
        r#"query GetPage($id: ID!) {
            page(id: $id) { id name blocks }
        }"#,
        json!({ "id": page_id }),
    )
    .await;

    assert_eq!(result["data"]["page"]["name"], "My Dashboard");
    assert!(result["data"]["page"]["blocks"].is_array());

    // 6. Update page blocks
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
            updatePage(id: $id, input: $input) { id name blocks }
        }"#,
        json!({
            "id": page_id,
            "input": {
                "blocks": [
                    { "id": "block-1", "type": "heading", "props": { "level": 1, "text": "Updated!" } }
                ]
            }
        }),
    )
    .await;

    assert_eq!(
        result["data"]["updatePage"]["blocks"][0]["props"]["text"],
        "Updated!"
    );

    // 7. List pages
    let result = graphql(
        &client,
        &gql_url,
        r#"query ListPages($wsId: ID!) {
            pages(workspaceId: $wsId) { id name }
        }"#,
        json!({ "wsId": workspace_id }),
    )
    .await;

    assert_eq!(result["data"]["pages"].as_array().unwrap().len(), 1);

    // 8. Create object schema (Attio-style)
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation CreateObject($input: CreateObjectSchemaInput!) {
            createObjectSchema(input: $input) { id name attributes }
        }"#,
        json!({
            "input": {
                "workspaceId": workspace_id,
                "name": "Ticket",
                "attributes": [
                    { "name": "title", "type": "text", "required": true },
                    { "name": "status", "type": "select", "options": ["open", "closed"] },
                    { "name": "priority", "type": "select", "options": ["low", "medium", "high"] }
                ]
            }
        }),
    )
    .await;

    let object_id = result["data"]["createObjectSchema"]["id"]
        .as_str()
        .expect("Should get object id");

    // 9. Create records
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation CreateRecord($input: CreateRecordInput!) {
            createRecord(input: $input) { id data }
        }"#,
        json!({
            "input": {
                "workspaceId": workspace_id,
                "objectId": object_id,
                "data": {
                    "title": "Fix login bug",
                    "status": "open",
                    "priority": "high"
                }
            }
        }),
    )
    .await;

    assert_eq!(
        result["data"]["createRecord"]["data"]["title"],
        "Fix login bug"
    );

    // 10. List records
    let result = graphql(
        &client,
        &gql_url,
        r#"query ListRecords($objectId: ID!, $wsId: ID!) {
            records(objectId: $objectId, workspaceId: $wsId) { id data }
        }"#,
        json!({ "objectId": object_id, "wsId": workspace_id }),
    )
    .await;

    assert_eq!(result["data"]["records"].as_array().unwrap().len(), 1);

    // 11. Delete page
    let result = graphql(
        &client,
        &gql_url,
        r#"mutation DeletePage($id: ID!) {
            deletePage(id: $id)
        }"#,
        json!({ "id": page_id }),
    )
    .await;

    assert_eq!(result["data"]["deletePage"], true);

    // Verify page is gone
    let result = graphql(
        &client,
        &gql_url,
        r#"query GetPage($id: ID!) {
            page(id: $id) { id }
        }"#,
        json!({ "id": page_id }),
    )
    .await;

    assert!(result["data"]["page"].is_null());

    cleanup(&pool).await;
}

#[tokio::test]
async fn test_webhook_receiver() {
    let (base, pool) = setup().await;
    cleanup(&pool).await;

    let client = Client::new();
    let resp = client
        .post(format!("{base}/api/v1/webhooks/jira"))
        .json(&json!({
            "event": "issue_created",
            "issue": { "key": "OPS-123", "summary": "Server down" }
        }))
        .send()
        .await
        .unwrap();

    assert_eq!(resp.status(), 202);
    let body: Value = resp.json().await.unwrap();
    assert_eq!(body["provider"], "jira");

    cleanup(&pool).await;
}
