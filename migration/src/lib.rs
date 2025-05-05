#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20250423_191123_entities;
mod m20250423_192926_users;
mod m20250423_193332_versioned_contents;
mod m20250423_194010_entities_versioned_contents;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250423_191123_entities::Migration),
            Box::new(m20250423_192926_users::Migration),
            Box::new(m20250423_193332_versioned_contents::Migration),
            Box::new(m20250423_194010_entities_versioned_contents::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}