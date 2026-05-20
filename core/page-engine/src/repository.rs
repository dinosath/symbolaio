use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{CreatePage, Page, UpdatePage};

#[derive(Clone)]
pub struct PageRepository {
    pool: PgPool,
}

impl PageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, input: CreatePage) -> Result<Page> {
        let page = sqlx::query_as::<_, Page>(
            r#"
            INSERT INTO pages (workspace_id, parent_id, name, icon, blocks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(input.workspace_id)
        .bind(input.parent_id)
        .bind(&input.name)
        .bind(&input.icon)
        .bind(&input.blocks)
        .bind(input.created_by)
        .fetch_one(&self.pool)
        .await?;

        Ok(page)
    }

    pub async fn get(&self, id: Uuid) -> Result<Option<Page>> {
        let page = sqlx::query_as::<_, Page>("SELECT * FROM pages WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(page)
    }

    pub async fn list(&self, workspace_id: Uuid, parent_id: Option<Uuid>) -> Result<Vec<Page>> {
        let pages = match parent_id {
            Some(pid) => {
                sqlx::query_as::<_, Page>(
                    "SELECT * FROM pages WHERE workspace_id = $1 AND parent_id = $2 ORDER BY created_at DESC",
                )
                .bind(workspace_id)
                .bind(pid)
                .fetch_all(&self.pool)
                .await?
            }
            None => {
                sqlx::query_as::<_, Page>(
                    "SELECT * FROM pages WHERE workspace_id = $1 ORDER BY created_at DESC",
                )
                .bind(workspace_id)
                .fetch_all(&self.pool)
                .await?
            }
        };
        Ok(pages)
    }

    pub async fn update(&self, id: Uuid, input: UpdatePage) -> Result<Option<Page>> {
        let page = sqlx::query_as::<_, Page>(
            r#"
            UPDATE pages SET
                name = COALESCE($2, name),
                icon = COALESCE($3, icon),
                blocks = COALESCE($4, blocks),
                updated_at = now()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.icon)
        .bind(&input.blocks)
        .fetch_optional(&self.pool)
        .await?;

        Ok(page)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM pages WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
