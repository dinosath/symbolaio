use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::*;

// ── Object Schemas ──────────────────────────────────────────────

#[derive(Clone)]
pub struct ObjectRepository {
    pool: PgPool,
}

impl ObjectRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, input: CreateObjectSchema) -> Result<ObjectSchema> {
        let obj = sqlx::query_as::<_, ObjectSchema>(
            r#"
            INSERT INTO object_schemas (workspace_id, service_id, name, attributes, capabilities)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(input.workspace_id)
        .bind(input.service_id)
        .bind(&input.name)
        .bind(&input.attributes)
        .bind(&input.capabilities)
        .fetch_one(&self.pool)
        .await?;
        Ok(obj)
    }

    pub async fn get(&self, id: Uuid) -> Result<Option<ObjectSchema>> {
        let obj = sqlx::query_as::<_, ObjectSchema>(
            "SELECT * FROM object_schemas WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(obj)
    }

    pub async fn list(&self, workspace_id: Uuid) -> Result<Vec<ObjectSchema>> {
        let objs = sqlx::query_as::<_, ObjectSchema>(
            "SELECT * FROM object_schemas WHERE workspace_id = $1 ORDER BY name",
        )
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(objs)
    }
}

// ── Records ─────────────────────────────────────────────────────

#[derive(Clone)]
pub struct RecordRepository {
    pool: PgPool,
}

impl RecordRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, input: CreateRecord) -> Result<Record> {
        let rec = sqlx::query_as::<_, Record>(
            r#"
            INSERT INTO records (workspace_id, object_id, data, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(input.workspace_id)
        .bind(input.object_id)
        .bind(&input.data)
        .bind(input.created_by)
        .fetch_one(&self.pool)
        .await?;
        Ok(rec)
    }

    pub async fn get(&self, id: Uuid) -> Result<Option<Record>> {
        let rec = sqlx::query_as::<_, Record>("SELECT * FROM records WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(rec)
    }

    pub async fn list(
        &self,
        object_id: Uuid,
        workspace_id: Uuid,
    ) -> Result<Vec<Record>> {
        let recs = sqlx::query_as::<_, Record>(
            "SELECT * FROM records WHERE object_id = $1 AND workspace_id = $2 ORDER BY created_at DESC",
        )
        .bind(object_id)
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(recs)
    }

    pub async fn update(&self, id: Uuid, input: UpdateRecord) -> Result<Option<Record>> {
        let rec = sqlx::query_as::<_, Record>(
            r#"
            UPDATE records SET data = $2, updated_at = now()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&input.data)
        .fetch_optional(&self.pool)
        .await?;
        Ok(rec)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM records WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
