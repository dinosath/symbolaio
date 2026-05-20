# API-Centric Composable Workspace Platform

## Vision

Create a programmable workspace platform where:

- Apps are replaced by composable views
- UI is metadata-driven
- Services are API-first
- AI agents can dynamically create workflows/pages/dashboards
- External systems integrate through APIs/events
- Users own workflows and data composition
- Frontend is dynamically rendered similar to Notion
- Backend services remain strongly typed and domain-oriented

The platform should behave like:

- a web-native operating system
- a programmable business runtime
- a composable workspace engine

instead of a traditional monolithic SaaS application.

---

# Core Principles

## 1. API-Centric Architecture

Everything must be accessible through APIs.

Including:

- entities
- workflows
- pages
- blocks
- dashboards
- permissions
- layouts
- automation
- AI actions
- integrations

The UI is a consumer of the same APIs exposed to external systems.

---

## 2. Views Are Data

Pages and dashboards must NOT be hardcoded.

Views are stored as metadata.

Example:

```json
{
  "id": "field-dashboard",
  "type": "dashboard",
  "layout": "grid",
  "widgets": [
    {
      "type": "kanban",
      "source": "tickets.open"
    }
  ]
}
```

This enables:

- dynamic rendering
- AI-generated dashboards
- plugin systems
- user customization
- runtime composition
- schema-driven UI

---

## 3. Service-Oriented Backend

Business logic belongs to domain services.

Frontend composition belongs to GraphQL.

Metadata belongs to PostgreSQL.

Realtime communication belongs to events/streams.

---

## 4. Strongly Typed Core

Internal systems should remain strongly typed.

Use:

- Rust
- gRPC
- protobuf
- typed events
- typed domain models

Avoid dynamic runtime-only architectures.

Metadata should be dynamic.

Core domain logic should remain strongly typed.

---

# High-Level Architecture

```text
                    ┌────────────────────┐
                    │   Web / Mobile UI  │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Dynamic View Engine│
                    │  (Notion-like)     │
                    └─────────┬──────────┘
                              │ GraphQL
                    ┌─────────▼──────────┐
                    │ API Composition    │
                    │ Gateway            │
                    └─────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
 ┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
 │ Ticket Service │  │ Knowledge Svc   │  │ Workflow Svc   │
 │ gRPC + Events  │  │ gRPC + Events   │  │ gRPC + Events  │
 └───────┬────────┘  └────────┬────────┘  └───────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ PostgreSQL         │
                    │ Metadata + Views   │
                    └────────────────────┘
```

---

# Architecture Layers

# 1. Domain Services Layer

## Responsibilities

Responsible for:

- business logic
- validation
- transactions
- workflows
- state transitions
- event publishing
- domain ownership

Each domain service owns:

- schemas
- invariants
- commands
- storage
- events

---

## Communication

### Internal

Use gRPC.

Reasons:

- strongly typed
- efficient
- streaming support
- polyglot support
- good for agent communication

---

## Example Service

```protobuf
service TicketService {
  rpc ListTickets(ListTicketsRequest)
      returns (ListTicketsResponse);

  rpc AssignTicket(AssignTicketRequest)
      returns (Ticket);

  rpc ResolveTicket(ResolveTicketRequest)
      returns (Ticket);
}
```

---

## Service Boundaries

Recommended bounded contexts:

- Identity
- Workspace
- Knowledge
- Ticketing
- Workflow
- Notifications
- Automation
- Integrations
- AI Agents
- Search
- Files
- Permissions

---

# 2. Metadata Layer

## Purpose

The metadata layer defines:

- layouts
- blocks
- widgets
- pages
- dashboards
- workflows
- forms
- relations
- UI schemas
- permissions
- automation

This is the heart of the platform.

---

## Database

Use PostgreSQL.

Reasons:

- JSONB support
- relational consistency
- indexing
- transactional guarantees
- mature ecosystem
- row-level security

---

# Core Metadata Tables

## entities

Defines logical entity types.

Example:

| field | type |
|---|---|
| id | uuid |
| name | text |
| schema | jsonb |
| capabilities | jsonb |
| version | int |

---

## views

Stores dynamic pages and dashboards.

Example:

| field | type |
|---|---|
| id | uuid |
| workspace_id | uuid |
| type | text |
| layout | jsonb |
| config | jsonb |
| created_by | uuid |

---

## widgets

Defines reusable UI blocks.

| field | type |
|---|---|
| id | uuid |
| type | text |
| config | jsonb |
| data_source | jsonb |

---

## workflows

Stores workflow definitions.

| field | type |
|---|---|
| id | uuid |
| trigger | jsonb |
| actions | jsonb |
| conditions | jsonb |

---

## integrations

Stores external service integrations.

| field | type |
|---|---|
| id | uuid |
| provider | text |
| credentials | encrypted |
| config | jsonb |

---

# 3. GraphQL Composition Layer

## Purpose

GraphQL should act as:

- aggregation layer
- composition layer
- frontend query engine
- metadata-aware API

GraphQL should NOT own:

- business logic
- domain invariants
- transactional orchestration

Those belong in domain services.

---

## Responsibilities

### Query Aggregation

Combine data from multiple services.

### Dynamic Querying

Allow frontend runtime to dynamically request data.

### Metadata Resolution

Resolve views/layouts/widgets dynamically.

### API Composition

Expose unified API surface.

---

## Example Query

```graphql
query Dashboard {
  dashboard(id: "field-dashboard") {
    layout

    widgets {
      type
      config

      data {
        ... on TicketList {
          items {
            id
            title
            priority
            assignee
          }
        }
      }
    }
  }
}
```

---

# 4. Dynamic Frontend Runtime

## Purpose

The frontend should behave like a runtime engine.

NOT like a traditional SPA with hardcoded screens.

The frontend dynamically renders:

- pages
- blocks
- forms
- dashboards
- workflows
- widgets
- relations
- actions

from metadata.

---

# Runtime Responsibilities

## Block Rendering

Render dynamic components.

Example:

```json
{
  "type": "table",
  "source": "tickets.open"
}
```

---

## Query Generation

Generate GraphQL queries dynamically.

---

## Realtime Updates

Subscribe to events.

---

## Offline Support

Support local-first caching.

---

## Plugin Loading

Allow runtime extension.

---

# Frontend Stack

Recommended:

- React
- TypeScript
- TanStack Query
- Zustand
- Monaco Editor
- Yjs
- Vite

---

# 5. Event System

## Purpose

The system should be event-driven.

Events power:

- realtime updates
- workflows
- automation
- AI agents
- integrations
- analytics
- projections

---

## Recommended Infrastructure

Use:

- NATS
- Kafka
- Redpanda

NATS is preferred initially for simplicity.

---

## Example Events

```json
{
  "event": "ticket.created",
  "entity_id": "123",
  "workspace_id": "abc",
  "payload": {
    "title": "Fiber outage"
  }
}
```

---

# 6. External Integration Architecture

## Goal

The platform must integrate easily with:

- Jira
- GitHub
- Slack
- ServiceNow
- Salesforce
- Telecom OSS/BSS
- ERP systems
- monitoring systems
- IoT systems

---

# Integration Model

## Adapters

Each integration should implement:

- auth
- sync
- webhooks
- schema mapping
- event mapping
- capability mapping

---

## Example Flow

```text
Jira Webhook
    ↓
Integration Service
    ↓
Normalize Entity
    ↓
Publish Event
    ↓
Update Views
    ↓
Realtime UI Refresh
```

---

# Public APIs

# REST APIs

Used for:

- external systems
- automation
- webhook integrations
- simple CRUD

Example:

```http
POST /api/views
```

```json
{
  "name": "Network Dashboard",
  "widgets": [
    {
      "type": "chart",
      "source": "network_alerts"
    }
  ]
}
```

---

# GraphQL APIs

Used for:

- frontend composition
- dashboards
- dynamic querying
- AI-driven UI generation

---

# gRPC APIs

Used for:

- internal services
- agent communication
- streaming
- typed contracts

---

# Webhooks

Used for:

- realtime integrations
- event propagation
- external automation

---

# Capability-Based Design

Avoid simple booleans like:

```json
{
  "editable": true
}
```

Instead expose capabilities.

Example:

```json
{
  "capabilities": [
    "ticket.assign",
    "ticket.resolve",
    "ticket.escalate"
  ]
}
```

This enables:

- plugin systems
- AI actions
- granular permissions
- automation
- external extension

---

# Plugin Architecture

# Plugin Types

## Data Source Plugins

Examples:

- Jira connector
- GitHub connector
- SAP connector

---

## Widget Plugins

Examples:

- outage map
- telemetry graph
- SLA board

---

## Action Plugins

Examples:

- restart router
- assign engineer
- deploy workflow

---

## AI Plugins

Examples:

- summarization
- incident analysis
- workflow planning

---

# AI-Native Design

The platform should be AI-first.

AI agents should be able to:

- generate dashboards
- create workflows
- compose pages
- analyze events
- automate actions
- generate forms
- query systems
- orchestrate APIs

---

# AI Tool Registry

Expose tools dynamically.

Example:

```json
{
  "tool": "ticket.assign",
  "input_schema": {
    "ticket_id": "uuid",
    "assignee": "string"
  }
}
```

---

# Realtime Collaboration

Recommended:

- CRDTs
- Yjs
- websocket sync

Support:

- multiplayer editing
- presence
- collaborative dashboards
- shared workspaces

---

# Security Model

# Authentication

Recommended:

- OAuth2
- OIDC
- JWT
- API keys

---

# Authorization

Use:

- RBAC
- ABAC
- capability system
- row-level security

---

# Multi-Tenancy

Every entity must include:

- workspace_id
- tenant_id

Use PostgreSQL row-level security.

---

# Recommended Tech Stack

# Backend

- Rust
- Axum
- tonic
- async-graphql
- SQLx or SeaORM
- PostgreSQL
- NATS
- Redis

---

# Frontend

- React
- TypeScript
- TanStack Query
- Monaco
- Yjs
- Zustand

---

# Infrastructure

- Docker
- Kubernetes
- OpenTelemetry
- Prometheus
- Grafana
- Loki

---

# Suggested Repository Structure

```text
/apps
  /web
  /mobile

/services
  /identity
  /ticketing
  /knowledge
  /workflow
  /integrations
  /ai-agent

/packages
  /proto
  /graphql-schema
  /ui-runtime
  /block-engine
  /sdk
  /event-contracts

/platform
  /gateway
  /metadata-engine
  /plugin-runtime

/infrastructure
  /docker
  /k8s
  /terraform
```

---

# Recommended Development Order

# Phase 1

Build:

- metadata engine
- dynamic views
- GraphQL gateway
- frontend runtime
- authentication

---

# Phase 2

Add:

- plugins
- workflows
- events
- realtime updates
- integrations

---

# Phase 3

Add:

- AI agents
- automation orchestration
- CRDT collaboration
- local-first sync

---

# Long-Term Vision

The long-term goal is NOT to create:

- another SaaS app

The goal is to create:

- a programmable workspace operating system
- a composable business runtime
- an API-native collaboration platform
- a dynamic UI engine driven by metadata and services

Where:

- apps become interchangeable
- views become programmable
- AI becomes orchestration
- APIs become the platform
- users own workflows instead of applications

