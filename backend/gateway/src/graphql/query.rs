use async_graphql::{Context, Object, Result, ID};
use uuid::Uuid;

use crate::graphql::types::*;
use crate::service_registry::ServiceRegistry;

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    // ── Pages ──────────────────────────────────────

    async fn page(&self, ctx: &Context<'_>, id: ID) -> Result<Option<Page>> {
        let repo = ctx.data::<symbolaio_page_engine::PageRepository>()?;
        let id: Uuid = id.parse()?;
        let page = repo.get(id).await?;
        Ok(page.map(Into::into))
    }

    async fn pages(
        &self,
        ctx: &Context<'_>,
        workspace_id: ID,
        parent_id: Option<ID>,
    ) -> Result<Vec<Page>> {
        let repo = ctx.data::<symbolaio_page_engine::PageRepository>()?;
        let ws_id: Uuid = workspace_id.parse()?;
        let pid = parent_id.map(|id| id.parse()).transpose()?;
        let pages = repo.list(ws_id, pid).await?;
        Ok(pages.into_iter().map(Into::into).collect())
    }

    // ── Objects ────────────────────────────────────

    async fn object_schema(&self, ctx: &Context<'_>, id: ID) -> Result<Option<ObjectSchema>> {
        let repo = ctx.data::<symbolaio_object_engine::ObjectRepository>()?;
        let id: Uuid = id.parse()?;
        let obj = repo.get(id).await?;
        Ok(obj.map(Into::into))
    }

    async fn object_schemas(
        &self,
        ctx: &Context<'_>,
        workspace_id: ID,
    ) -> Result<Vec<ObjectSchema>> {
        let repo = ctx.data::<symbolaio_object_engine::ObjectRepository>()?;
        let ws_id: Uuid = workspace_id.parse()?;
        let objs = repo.list(ws_id).await?;
        Ok(objs.into_iter().map(Into::into).collect())
    }

    // ── Records ────────────────────────────────────

    async fn record(&self, ctx: &Context<'_>, id: ID) -> Result<Option<Record>> {
        let repo = ctx.data::<symbolaio_object_engine::RecordRepository>()?;
        let id: Uuid = id.parse()?;
        let rec = repo.get(id).await?;
        Ok(rec.map(Into::into))
    }

    async fn records(
        &self,
        ctx: &Context<'_>,
        object_id: ID,
        workspace_id: ID,
    ) -> Result<Vec<Record>> {
        let repo = ctx.data::<symbolaio_object_engine::RecordRepository>()?;
        let obj_id: Uuid = object_id.parse()?;
        let ws_id: Uuid = workspace_id.parse()?;
        let recs = repo.list(obj_id, ws_id).await?;
        Ok(recs.into_iter().map(Into::into).collect())
    }

    // ── Service Registry ───────────────────────────

    async fn services(
        &self,
        ctx: &Context<'_>,
        workspace_id: ID,
    ) -> Result<Vec<Service>> {
        let reg = ctx.data::<ServiceRegistry>()?;
        let ws_id: Uuid = workspace_id.parse()?;
        let svcs = reg.list_services(ws_id).await?;
        Ok(svcs)
    }

    async fn available_widgets(
        &self,
        ctx: &Context<'_>,
        workspace_id: ID,
    ) -> Result<Vec<WidgetDefinition>> {
        let reg = ctx.data::<ServiceRegistry>()?;
        let ws_id: Uuid = workspace_id.parse()?;
        let widgets = reg.list_widgets(ws_id).await?;
        Ok(widgets)
    }

    // ── Auth ───────────────────────────────────────

    async fn me(&self, ctx: &Context<'_>) -> Result<Option<User>> {
        // For now, extract user_id from header context
        // In a real setup, the auth middleware populates this
        let identity_client = ctx.data::<symbolaio_proto::identity::identity_service_client::IdentityServiceClient<tonic::transport::Channel>>()?;

        // TODO: extract user from JWT context via async-graphql guard
        // For MVP, return None when no auth context
        let _ = identity_client;
        Ok(None)
    }
}
