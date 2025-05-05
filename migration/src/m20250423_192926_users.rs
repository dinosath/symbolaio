use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "users",
            &[
            ("id", ColType::PkAuto),
            ("pid", ColType::Uuid),
            ("api_key", ColType::StringUniq),
            ("email", ColType::StringUniq),
            ("email_verification_sent_at", ColType::TimestampWithTimeZoneNull),
            ("email_verification_token", ColType::StringNull),
            ("email_verified_at", ColType::TimestampWithTimeZoneNull),
            ("password", ColType::String),
            ("reset_sent_at", ColType::TimestampWithTimeZoneNull),
            ("reset_token", ColType::StringNull),
            ("username", ColType::String),
            ],
            &[
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "users").await
    }
}
