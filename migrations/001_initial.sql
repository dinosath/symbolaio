-- Symbolaio Phase 1 Schema
-- Run: psql $DATABASE_URL -f migrations/001_initial.sql

-- === Identity ===

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    owner_id   UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (workspace_id, user_id)
);

-- === Service Registry ===

CREATE TABLE IF NOT EXISTS services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    endpoint_grpc TEXT,
    endpoint_rest TEXT,
    spec_openapi  JSONB,
    spec_asyncapi JSONB,
    spec_proto    TEXT,
    capabilities  JSONB NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS widget_registry (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id     UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    widget_type    TEXT NOT NULL,
    bundle_url     TEXT,
    config_schema  JSONB NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Pages (Notion-style) ===

CREATE TABLE IF NOT EXISTS pages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    icon          TEXT,
    cover_url     TEXT,
    blocks        JSONB NOT NULL DEFAULT '[]',
    created_by    UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Data Objects (Attio-style) ===

CREATE TABLE IF NOT EXISTS object_schemas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_id    UUID REFERENCES services(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    attributes    JSONB NOT NULL DEFAULT '[]',
    capabilities  JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    object_id     UUID NOT NULL REFERENCES object_schemas(id) ON DELETE CASCADE,
    data          JSONB NOT NULL DEFAULT '{}',
    created_by    UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Indexes ===

CREATE INDEX IF NOT EXISTS idx_services_workspace ON services(workspace_id);
CREATE INDEX IF NOT EXISTS idx_widget_registry_service ON widget_registry(service_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_object_schemas_workspace ON object_schemas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_records_object ON records(object_id);
CREATE INDEX IF NOT EXISTS idx_records_workspace ON records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_records_data ON records USING GIN (data);
