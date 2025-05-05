use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "entities_versioned_contents",
            &[
            
            ("id", ColType::PkAuto),
            
            ("version", ColType::String),
            ],
            &[
            ("entity", ""),
            ("versioned_content", ""),
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "entities_versioned_contents").await
    }
}
