use async_graphql::{Context, Object, Result, ID};
use uuid::Uuid;

use crate::graphql::types::*;

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    // ── Auth ───────────────────────────────────────

    async fn register(&self, ctx: &Context<'_>, input: RegisterInput) -> Result<AuthPayload> {
        let mut client = ctx
            .data::<symbolaio_proto::identity::identity_service_client::IdentityServiceClient<tonic::transport::Channel>>()?
            .clone();

        let resp = client
            .register(symbolaio_proto::identity::RegisterRequest {
                email: input.email,
                password: input.password,
                display_name: input.display_name,
            })
            .await
            .map_err(|e| async_graphql::Error::new(e.message()))?;

        let r = resp.into_inner();
        Ok(AuthPayload {
            access_token: r.access_token,
            user_id: r.user_id.into(),
        })
    }

    async fn login(&self, ctx: &Context<'_>, input: LoginInput) -> Result<AuthPayload> {
        let mut client = ctx
            .data::<symbolaio_proto::identity::identity_service_client::IdentityServiceClient<tonic::transport::Channel>>()?
            .clone();

        let resp = client
            .login(symbolaio_proto::identity::LoginRequest {
                email: input.email,
                password: input.password,
            })
            .await
            .map_err(|e| async_graphql::Error::new(e.message()))?;

        let r = resp.into_inner();
        Ok(AuthPayload {
            access_token: r.access_token,
            user_id: r.user_id.into(),
        })
    }

    async fn create_workspace(
        &self,
        ctx: &Context<'_>,
        name: String,
        owner_id: ID,
    ) -> Result<Workspace> {
        let mut client = ctx
            .data::<symbolaio_proto::identity::identity_service_client::IdentityServiceClient<tonic::transport::Channel>>()?
            .clone();

        let resp = client
            .create_workspace(symbolaio_proto::identity::CreateWorkspaceRequest {
                name,
                owner_id: owner_id.to_string(),
            })
            .await
            .map_err(|e| async_graphql::Error::new(e.message()))?;

        let ws = resp.into_inner();
        Ok(Workspace {
            id: ws.id.into(),
            name: ws.name,
            owner_id: ws.owner_id.into(),
            created_at: ws.created_at,
        })
    }

    // ── Pages ──────────────────────────────────────

    async fn create_page(&self, ctx: &Context<'_>, input: CreatePageInput) -> Result<Page> {
        let repo = ctx.data::<symbolaio_page_engine::PageRepository>()?;
        let page = repo
            .create(symbolaio_page_engine::CreatePage {
                workspace_id: input.workspace_id.parse()?,
                parent_id: input.parent_id.map(|id| id.parse()).transpose()?,
                name: input.name,
                icon: input.icon,
                blocks: input.blocks,
                created_by: None, // TODO: from auth context
            })
            .await?;
        Ok(page.into())
    }

    async fn update_page(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdatePageInput,
    ) -> Result<Option<Page>> {
        let repo = ctx.data::<symbolaio_page_engine::PageRepository>()?;
        let page = repo
            .update(
                id.parse()?,
                symbolaio_page_engine::UpdatePage {
                    name: input.name,
                    icon: input.icon,
                    blocks: input.blocks,
                },
            )
            .await?;
        Ok(page.map(Into::into))
    }

    async fn delete_page(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let repo = ctx.data::<symbolaio_page_engine::PageRepository>()?;
        let deleted = repo.delete(id.parse()?).await?;
        Ok(deleted)
    }

    // ── Object Schemas ─────────────────────────────

    async fn create_object_schema(
        &self,
        ctx: &Context<'_>,
        input: CreateObjectSchemaInput,
    ) -> Result<ObjectSchema> {
        let repo = ctx.data::<symbolaio_object_engine::ObjectRepository>()?;
        let obj = repo
            .create(symbolaio_object_engine::CreateObjectSchema {
                workspace_id: input.workspace_id.parse()?,
                service_id: None,
                name: input.name,
                attributes: input.attributes,
                capabilities: input.capabilities.unwrap_or(serde_json::json!([])),
            })
            .await?;
        Ok(obj.into())
    }

    // ── Records ────────────────────────────────────

    async fn create_record(&self, ctx: &Context<'_>, input: CreateRecordInput) -> Result<Record> {
        let repo = ctx.data::<symbolaio_object_engine::RecordRepository>()?;
        let rec = repo
            .create(symbolaio_object_engine::CreateRecord {
                workspace_id: input.workspace_id.parse()?,
                object_id: input.object_id.parse()?,
                data: input.data,
                created_by: None, // TODO: from auth context
            })
            .await?;
        Ok(rec.into())
    }

    async fn update_record(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdateRecordInput,
    ) -> Result<Option<Record>> {
        let repo = ctx.data::<symbolaio_object_engine::RecordRepository>()?;
        let rec = repo
            .update(
                id.parse()?,
                symbolaio_object_engine::UpdateRecord { data: input.data },
            )
            .await?;
        Ok(rec.map(Into::into))
    }

    async fn delete_record(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let repo = ctx.data::<symbolaio_object_engine::RecordRepository>()?;
        let deleted = repo.delete(id.parse()?).await?;
        Ok(deleted)
    }
}
