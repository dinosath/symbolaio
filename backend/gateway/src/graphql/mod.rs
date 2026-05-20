pub mod mutation;
pub mod query;
pub mod types;

use async_graphql::{EmptySubscription, Schema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{extract::State, middleware, response::IntoResponse, routing::{get, post}, Router};

use sqlx::PgPool;

use crate::auth;

pub type AppSchema = Schema<query::QueryRoot, mutation::MutationRoot, EmptySubscription>;

pub fn build_schema(
    pool: PgPool,
    identity_client: symbolaio_proto::identity::identity_service_client::IdentityServiceClient<
        tonic::transport::Channel,
    >,
) -> AppSchema {
    let page_repo = symbolaio_page_engine::PageRepository::new(pool.clone());
    let object_repo = symbolaio_object_engine::ObjectRepository::new(pool.clone());
    let record_repo = symbolaio_object_engine::RecordRepository::new(pool.clone());
    let service_reg = crate::service_registry::ServiceRegistry::new(pool.clone());

    Schema::build(
        query::QueryRoot,
        mutation::MutationRoot,
        EmptySubscription,
    )
    .data(pool)
    .data(page_repo)
    .data(object_repo)
    .data(record_repo)
    .data(service_reg)
    .data(identity_client)
    .finish()
}

pub fn routes(schema: AppSchema) -> Router {
    Router::new()
        .route("/graphql", get(graphql_playground).post(graphql_handler))
        .layer(middleware::from_fn(auth::auth_middleware))
        .with_state(schema)
}


async fn graphql_handler(
    State(schema): State<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphql_playground(State(_schema): State<AppSchema>) -> impl IntoResponse {
    axum::response::Html(
        async_graphql::http::playground_source(
            async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
        ),
    )
}
