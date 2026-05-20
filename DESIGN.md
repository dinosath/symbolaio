# Symbolaio — Design Document

## What Is This

A Kubernetes-native runtime for composable workspaces. You don't build apps — you install **services** that provide APIs, widgets, and microfrontend components. The platform discovers what each service offers by reading its API specs (OpenAPI, AsyncAPI, protobuf), registers its capabilities, and lets users compose pages and dashboards from them — Notion-style.

**Notion** gives you composable pages from blocks.
**Attio** gives you programmable data objects with an API-first SDK.
**Symbolaio** gives you both — and the blocks, data, and integrations come from **self-describing services** that anyone can build and install.

---

## Core Concept: Services Are The Unit Of Everything

A **service** in Symbolaio is not just a backend. It's a **provider** that can ship:

| What | How it's described | Example |
|---|---|---|
| REST endpoints | OpenAPI / Swagger spec | `GET /tickets`, `POST /tickets` |
| gRPC methods | .proto files | `TicketService.Assign` |
| Event channels | AsyncAPI spec | `ticket.created`, `ticket.resolved` |
| Widgets | Widget manifest (JSON) | Kanban board, SLA chart, outage map |
| Microfrontend components | Component manifest + JS bundle URL | Full custom UI panels |
| Integrations | Integration manifest | Jira sync, GitHub webhook handler |
| Data objects | Object schema (like Attio) | Custom "Ticket", "Device", "Contract" objects |

When a service is deployed to the cluster, the **Symbolaio Operator** reads its specs, registers everything in the platform registry, and makes it available to the page builder, the API gateway, and the event mesh.

A 3rd party can provide a service. Your own team can provide a service. They're the same thing.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  Symbolaio Operator (CRD watcher)           │    │
│  │  Reads: OpenAPI, AsyncAPI, .proto, widget/component manifests│   │
│  │  Writes: service_registry, widget_registry, object_schemas  │    │
│  └──────────┬──────────────────────┬───────────────────────────┘    │
│             │                      │                                │
│  ┌──────────▼──────────┐  ┌───────▼────────────┐                   │
│  │   Platform Core     │  │  Installed Services │                   │
│  │                     │  │                     │                   │
│  │  ● Gateway (Axum)   │  │  ● Ticketing svc    │                   │
│  │    - GraphQL        │  │  ● Knowledge svc    │                   │
│  │    - REST proxy     │  │  ● Jira adapter     │                   │
│  │    - gRPC proxy     │  │  ● GitHub adapter   │                   │
│  │  ● Page Engine      │  │  ● Custom svc (3rd) │                   │
│  │  ● Identity svc     │  │  ● ...              │                   │
│  │  ● Registry         │  └─────────┬───────────┘                   │
│  └──────────┬──────────┘            │                               │
│             │                       │                               │
│  ┌──────────▼───────────────────────▼──────────┐                    │
│  │              NATS (event mesh)               │                    │
│  └──────────┬──────────────────────────────────┘                    │
│             │                                                       │
│  ┌──────────▼──────────┐                                            │
│  │   PostgreSQL        │                                            │
│  │   ● pages/views     │                                            │
│  │   ● widget layouts  │                                            │
│  │   ● object schemas  │                                            │
│  │   ● service registry│                                            │
│  │   ● users/workspaces│                                            │
│  └─────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Operator: Service Discovery Via API Specs

The Symbolaio Operator is a Kubernetes controller. When a service is deployed with a `SymbolaioService` CRD, the operator:

1. Reads the service's API documentation:
   - **OpenAPI/Swagger** → discovers REST endpoints, schemas, capabilities
   - **AsyncAPI** → discovers event channels, message schemas
   - **Protobuf (.proto)** → discovers gRPC methods, typed contracts
   - **Widget manifest** → discovers UI components the service provides
   - **Component manifest** → discovers microfrontend bundles

2. Registers everything into the platform's **service registry** (PostgreSQL)

3. The gateway, page builder, and event mesh automatically pick up the new capabilities

### CRD Example

```yaml
apiVersion: symbolaio.io/v1alpha1
kind: SymbolaioService
metadata:
  name: ticketing
  namespace: symbolaio
spec:
  # Where to reach this service
  endpoints:
    grpc: "ticketing:50051"
    rest: "http://ticketing:8080"

  # API specs — the operator fetches and parses these
  specs:
    openapi: "http://ticketing:8080/openapi.json"
    asyncapi: "http://ticketing:8080/asyncapi.json"
    proto: "http://ticketing:8080/protos/ticketing.proto"

  # Widget/component manifests
  widgets:
    - name: "ticket-kanban"
      type: "kanban"
      bundle: "http://ticketing:8080/widgets/kanban.js"
      config_schema:
        properties:
          statuses: { type: "array", items: { type: "string" } }
          source: { type: "string" }
    - name: "ticket-table"
      type: "table"
      bundle: "http://ticketing:8080/widgets/table.js"

  # Data objects this service manages
  objects:
    - name: "Ticket"
      schema:
        properties:
          title: { type: "string" }
          status: { type: "string", enum: ["open", "in_progress", "resolved"] }
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] }
          assignee: { type: "string", format: "uuid" }

  # Capabilities this service exposes
  capabilities:
    - "ticket.create"
    - "ticket.assign"
    - "ticket.resolve"
    - "ticket.escalate"
```

When this CRD is applied, the operator parses all the specs and the gateway immediately knows how to route queries to this service, the page builder knows what widgets are available, and the event mesh subscribes to the service's channels.

---

## Page Builder: Notion-Style Composition

Users build pages by composing **blocks**. Each block is backed by either a built-in component or a widget provided by an installed service.

### Page Structure

A page is a tree of blocks stored as metadata:

```json
{
  "id": "page-uuid",
  "workspace_id": "ws-uuid",
  "name": "Operations Dashboard",
  "blocks": [
    {
      "id": "block-1",
      "type": "heading",
      "props": { "level": 1, "text": "Active Incidents" }
    },
    {
      "id": "block-2",
      "type": "service-widget",
      "service": "ticketing",
      "widget": "ticket-kanban",
      "props": {
        "statuses": ["open", "in_progress", "escalated"],
        "source": "tickets?priority=critical"
      }
    },
    {
      "id": "block-3",
      "type": "columns",
      "children": [
        {
          "id": "block-3a",
          "type": "service-widget",
          "service": "monitoring",
          "widget": "alert-chart",
          "props": { "timeRange": "24h" }
        },
        {
          "id": "block-3b",
          "type": "service-widget",
          "service": "ticketing",
          "widget": "ticket-table",
          "props": { "filter": "assignee=me" }
        }
      ]
    },
    {
      "id": "block-4",
      "type": "text",
      "props": { "content": "Updated every 30 seconds via NATS subscription." }
    }
  ]
}
```

### Block Types

| Type | Source | Description |
|---|---|---|
| `heading` | Built-in | H1-H6 text |
| `text` | Built-in | Rich text (Markdown) |
| `columns` | Built-in | Multi-column layout container |
| `divider` | Built-in | Visual separator |
| `callout` | Built-in | Highlighted info box |
| `table` | Built-in | Generic data table |
| `service-widget` | Installed service | Widget provided by a service (kanban, chart, map, etc.) |
| `microfrontend` | Installed service | Full custom UI component (JS bundle) |
| `embed` | Built-in | Embed external URL / iframe |
| `object-list` | Built-in | List records of a data object type |
| `object-detail` | Built-in | Detail view of a single record |
| `form` | Built-in | Dynamic form generated from object schema |

---

## Data Objects: Attio-Style Programmable Data

Like Attio, users and services can define **custom data objects** with typed attributes and relationships. These aren't hardcoded models — they're schema-defined and stored as metadata.

### Object Definition

```json
{
  "name": "Contract",
  "workspace_id": "ws-uuid",
  "attributes": [
    { "name": "title", "type": "text", "required": true },
    { "name": "value", "type": "currency", "config": { "currency": "USD" } },
    { "name": "status", "type": "select", "options": ["draft", "active", "expired"] },
    { "name": "start_date", "type": "date" },
    { "name": "end_date", "type": "date" },
    { "name": "customer", "type": "relation", "target": "Customer" },
    { "name": "owner", "type": "relation", "target": "User" }
  ],
  "capabilities": ["contract.create", "contract.approve", "contract.terminate"]
}
```

### Attribute Types

`text`, `number`, `currency`, `date`, `datetime`, `boolean`, `select`, `multi_select`, `relation`, `email`, `url`, `json`, `file`

### Records

Records are stored as JSONB rows with their object type reference:

```json
{
  "id": "record-uuid",
  "object_id": "contract-object-uuid",
  "workspace_id": "ws-uuid",
  "data": {
    "title": "Enterprise Support Agreement",
    "value": { "amount": 50000, "currency": "USD" },
    "status": "active",
    "customer": "customer-uuid",
    "owner": "user-uuid"
  }
}
```

Any widget or page can query records by object type. The API gateway exposes them generically — no per-object-type code needed.

---

## API Surface

### Gateway Exposes Three Protocols

The gateway doesn't own business logic. It routes to services discovered by the operator.

**GraphQL** — for frontend composition and the page builder:

```graphql
type Query {
  # Pages
  page(id: ID!): Page
  pages(workspaceId: ID!): [Page!]!

  # Service registry
  services(workspaceId: ID!): [Service!]!
  availableWidgets(workspaceId: ID!): [WidgetDefinition!]!

  # Data objects (Attio-style)
  objectSchema(id: ID!): ObjectSchema
  objectSchemas(workspaceId: ID!): [ObjectSchema!]!
  records(objectId: ID!, filter: JSON): [Record!]!
  record(id: ID!): Record

  # Proxy to any registered service endpoint
  serviceQuery(service: String!, path: String!, params: JSON): JSON

  me: User
}

type Mutation {
  # Pages
  createPage(input: CreatePageInput!): Page!
  updatePage(id: ID!, blocks: JSON!): Page!
  deletePage(id: ID!): Boolean!

  # Data objects
  createObjectSchema(input: CreateObjectSchemaInput!): ObjectSchema!
  createRecord(objectId: ID!, data: JSON!): Record!
  updateRecord(id: ID!, data: JSON!): Record!
  deleteRecord(id: ID!): Boolean!

  # Proxy mutations to services
  serviceMutation(service: String!, action: String!, input: JSON!): JSON

  # Auth
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createWorkspace(name: String!): Workspace!
}

type Subscription {
  # Realtime block/page updates
  pageUpdated(pageId: ID!): Page!
  # Events from any service
  serviceEvents(workspaceId: ID!, channel: String!): Event!
}
```

**REST** — for external systems, webhooks, and simple integrations:

```
GET    /api/v1/pages
POST   /api/v1/pages
GET    /api/v1/objects/{object_id}/records
POST   /api/v1/objects/{object_id}/records
POST   /api/v1/webhooks/{provider}
GET    /api/v1/services
GET    /api/v1/services/{name}/openapi.json

GET    /healthz
GET    /readyz
```

**gRPC** — for internal service-to-service and high-performance clients:

```protobuf
service PlatformService {
  rpc GetPage(GetPageRequest) returns (Page);
  rpc UpdatePage(UpdatePageRequest) returns (Page);
  rpc QueryRecords(QueryRecordsRequest) returns (RecordList);
  rpc PublishEvent(PublishEventRequest) returns (PublishEventResponse);
}
```

---

## Event Mesh (NATS)

Every service publishes events. The platform subscribes and routes them.

### Subject Convention

```
symbolaio.{workspace_id}.{service}.{object}.{action}
```

Examples:
```
symbolaio.ws-123.ticketing.ticket.created
symbolaio.ws-123.ticketing.ticket.resolved
symbolaio.ws-123.jira-adapter.ticket.synced
symbolaio.ws-123.github-adapter.issue.created
symbolaio.ws-123.platform.page.updated
```

Services declare their channels in **AsyncAPI** specs. The operator registers them. The gateway can subscribe on behalf of the frontend via WebSocket/GraphQL subscriptions.

---

## Security & Multi-Tenancy

- **Auth**: JWT (issued by identity service), OAuth2/OIDC for external
- **Multi-tenancy**: every row has `workspace_id`, PostgreSQL RLS enforced
- **Service isolation**: services run in their own namespaces, network policies restrict cross-service traffic
- **Capabilities**: actions are capability-gated, not role-boolean. `["ticket.assign", "ticket.resolve"]` not `{ "admin": true }`
- **3rd party services**: sandboxed namespace, no direct DB access, communicate only via APIs and NATS

---

# Phases

## Phase 1 — MVP: Platform Core + Page Builder + Object System

**Goal:** A running platform where you can install a service via CRD, the operator discovers its APIs, users can define custom data objects, create records, and compose Notion-style pages from built-in blocks. Everything on Kubernetes.

### What Gets Built

| Component | Description |
|---|---|
| **Symbolaio Operator** | Watches `SymbolaioService` CRDs, parses OpenAPI/AsyncAPI/proto specs, writes to service registry |
| **Gateway** | Axum HTTP server: GraphQL + REST + gRPC proxy, routes to registered services |
| **Page Engine** | CRUD for pages and blocks, stores block trees as JSONB |
| **Object Engine** | Custom object schemas + records (Attio-style), generic CRUD |
| **Identity Service** | Users, workspaces, JWT auth |
| **Service Registry** | PostgreSQL tables tracking installed services, their endpoints, schemas, widgets |

### Data Model (PostgreSQL)

```sql
-- === Identity ===

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    owner_id   UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id),
    user_id      UUID REFERENCES users(id),
    role         TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (workspace_id, user_id)
);

-- === Service Registry ===
-- Populated by the operator when it reads CRDs + API specs

CREATE TABLE services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id),
    name          TEXT NOT NULL,
    endpoint_grpc TEXT,
    endpoint_rest TEXT,
    spec_openapi  JSONB,           -- parsed OpenAPI spec
    spec_asyncapi JSONB,           -- parsed AsyncAPI spec
    spec_proto    TEXT,             -- raw .proto content
    capabilities  JSONB NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, name)
);

-- Widgets registered by services
CREATE TABLE widget_registry (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id     UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    widget_type    TEXT NOT NULL,
    bundle_url     TEXT,            -- JS bundle for microfrontend
    config_schema  JSONB NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Pages (Notion-style) ===

CREATE TABLE pages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id),
    parent_id     UUID REFERENCES pages(id),  -- nested pages
    name          TEXT NOT NULL,
    icon          TEXT,
    cover_url     TEXT,
    blocks        JSONB NOT NULL DEFAULT '[]', -- ordered block tree
    created_by    UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Data Objects (Attio-style) ===

CREATE TABLE object_schemas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id),
    service_id    UUID REFERENCES services(id),  -- NULL = user-defined
    name          TEXT NOT NULL,
    attributes    JSONB NOT NULL DEFAULT '[]',
    capabilities  JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, name)
);

CREATE TABLE records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id),
    object_id     UUID NOT NULL REFERENCES object_schemas(id),
    data          JSONB NOT NULL DEFAULT '{}',
    created_by    UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Indexes ===

CREATE INDEX idx_services_workspace ON services(workspace_id);
CREATE INDEX idx_widget_registry_service ON widget_registry(service_id);
CREATE INDEX idx_pages_workspace ON pages(workspace_id);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_object_schemas_workspace ON object_schemas(workspace_id);
CREATE INDEX idx_records_object ON records(object_id);
CREATE INDEX idx_records_workspace ON records(workspace_id);
CREATE INDEX idx_records_data ON records USING GIN (data);
```

### Rust Crates (Phase 1)

| Crate | Path | Purpose |
|---|---|---|
| `symbolaio-proto` | `packages/proto` | Protobuf defs + generated code |
| `symbolaio-events` | `packages/event-contracts` | NATS event types + pub/sub helpers |
| `symbolaio-operator` | `platform/operator` | K8s controller, CRD watcher, spec parser |
| `symbolaio-gateway` | `platform/gateway` | Axum + GraphQL + REST + gRPC proxy |
| `symbolaio-page-engine` | `platform/page-engine` | Page/block CRUD, block tree operations |
| `symbolaio-object-engine` | `platform/object-engine` | Object schemas + records, generic CRUD |
| `symbolaio-identity` | `services/identity` | Users, workspaces, JWT |

### Kubernetes Resources (Phase 1)

| Resource | Notes |
|---|---|
| CRD: `SymbolaioService` | Defines a service and its specs |
| Deployment: `symbolaio-operator` | Watches CRDs, populates registry |
| Deployment: `symbolaio-gateway` | External entry point (2 replicas, HPA) |
| Deployment: `symbolaio-identity` | Auth service |
| StatefulSet: `postgresql` | Or CloudNativePG operator |
| Deployment: `nats` | JetStream enabled |
| Ingress | Routes to gateway only |

### Deliverables

- [ ] `SymbolaioService` CRD definition
- [ ] Operator that watches CRDs and parses OpenAPI/AsyncAPI/proto specs
- [ ] Service registry (DB + query API)
- [ ] Widget registry (DB + query API)
- [ ] Page engine: create/update/delete pages with block trees
- [ ] Object engine: define schemas, CRUD records, filter by JSONB
- [ ] Gateway: GraphQL + REST, routes to registered services
- [ ] Identity: register, login, JWT, workspaces
- [ ] NATS event publishing on all mutations
- [ ] SQL migrations
- [ ] Dockerfiles (multi-stage)
- [ ] Kubernetes manifests + CRD
- [ ] Health probes

---

## Phase 2 — Service Widgets + Microfrontends + Realtime

**Goal:** Installed services can provide actual UI widgets and microfrontend components. Pages render service-provided widgets. Realtime event subscriptions work end-to-end.

### What Gets Built

| Component | Description |
|---|---|
| **Widget runtime** | Frontend loads JS bundles from widget registry, renders in sandboxed iframes or web components |
| **Microfrontend loader** | Component manifest → lazy-loaded JS module federation or iframe |
| **GraphQL subscriptions** | NATS → WebSocket → frontend for live updates |
| **Workflow engine** | Trigger → condition → action pipelines, driven by NATS events |
| **Webhook receiver** | Inbound webhooks from 3rd parties, normalized to NATS events |

### Data Model Additions

```sql
CREATE TABLE workflows (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL REFERENCES workspaces(id),
    name          TEXT NOT NULL,
    trigger       JSONB NOT NULL,    -- { "event": "ticketing.ticket.created", "filter": {...} }
    actions       JSONB NOT NULL,    -- [{ "type": "service_call", "service": "slack", "action": "notify", "input": {...} }]
    conditions    JSONB NOT NULL DEFAULT '{}',
    enabled       BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  UUID NOT NULL,
    provider      TEXT NOT NULL,
    payload       JSONB NOT NULL,
    processed     BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Deliverables

- [ ] Widget runtime (sandboxed loading of service JS bundles)
- [ ] Microfrontend component loader
- [ ] GraphQL subscriptions → NATS → WebSocket
- [ ] Workflow engine (event-driven trigger/action)
- [ ] Inbound webhook receiver + normalization
- [ ] Reference service: ticketing (with widgets + events)

---

## Phase 3 — AI Agents + Collaboration + Marketplace

**Goal:** AI agents can compose pages and trigger actions via the same API. Users collaborate in real-time. 3rd party services can be published and discovered.

### What Gets Built

| Component | Description |
|---|---|
| **AI tool registry** | Auto-generated from service capabilities + object schemas |
| **Agent runtime** | LLM orchestration that can call any registered service action |
| **CRDT collaboration** | Yjs/Automerge for concurrent page editing |
| **Presence** | Who's viewing what, cursor positions |
| **Service marketplace** | Publish/discover `SymbolaioService` packages (Helm charts + manifests) |

### AI Tool Registry

Every service capability + every object mutation is automatically exposed as an AI-callable tool:

```json
{
  "tools": [
    {
      "name": "ticketing.ticket.create",
      "description": "Create a new ticket",
      "source": "service:ticketing",
      "input_schema": { "$ref": "#/components/schemas/Ticket" }
    },
    {
      "name": "platform.page.create",
      "description": "Create a new page with blocks",
      "source": "platform",
      "input_schema": { "name": "string", "blocks": "array" }
    }
  ]
}
```

### Deliverables

- [ ] AI tool registry (auto-generated from service specs)
- [ ] Agent runtime (tool calling, LLM integration)
- [ ] CRDT page editing
- [ ] Presence system
- [ ] Service marketplace (publish/install/update)
- [ ] CLI: `symbolaio install <service>`

---

# Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | Rust | Performance, safety, strong types |
| HTTP framework | Axum | Tower ecosystem, async, production-ready |
| GraphQL | async-graphql | Subscriptions, Rust-native |
| gRPC | tonic + prost | Typed contracts, streaming |
| Database | PostgreSQL + SQLx | JSONB, RLS, compile-time query checks |
| Events | NATS JetStream | Simple, fast, at-least-once, subject-based routing |
| K8s operator | kube-rs | Rust-native K8s client + controller runtime |
| Spec parsing | openapiv3 + async-api-parser | Read service API docs |
| Auth | JWT + argon2 | Stateless, K8s-friendly |
| Observability | OpenTelemetry | Traces + metrics, vendor-neutral |
| Containers | Docker (distroless) | Minimal surface |
| Orchestration | Kubernetes | Service discovery, scaling, CRDs, operators |

---

# Repository Structure

```
symbolaio/
├── Cargo.toml                       # Workspace root
├── DESIGN.md
├── IDEAS.md
│
├── packages/
│   ├── proto/                       # Protobuf definitions + generated code
│   └── event-contracts/             # Typed event structs + NATS helpers
│
├── platform/
│   ├── operator/                    # K8s operator — CRD watcher, spec parser
│   ├── gateway/                     # HTTP + GraphQL + REST + gRPC proxy
│   ├── page-engine/                 # Page/block CRUD (library crate)
│   └── object-engine/              # Object schema + record CRUD (library crate)
│
├── services/
│   ├── identity/                    # Auth, users, workspaces
│   └── ticketing/                   # Reference service (Phase 2)
│
├── migrations/                      # SQL migrations
│
├── infrastructure/
│   ├── docker/                      # Dockerfiles
│   └── k8s/
│       ├── crds/                    # SymbolaioService CRD
│       ├── base/                    # Base manifests (kustomize)
│       └── overlays/
│           └── dev/
│
└── .github/
    └── workflows/
```

---

# Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Service discovery | Operator reads API specs from CRDs | Services self-describe; no manual registration |
| Page model | Block tree as JSONB | Notion-style nested composition, flexible |
| Data objects | Schema-defined, records as JSONB | Attio-style programmable data without code generation |
| Widget delivery | JS bundle URL in widget registry | Services ship their own UI, platform just loads it |
| Microfrontends | Sandboxed iframe or web component | Isolation between 3rd party UI code |
| Spec formats | OpenAPI + AsyncAPI + proto | Industry standards, tooling exists |
| Event subjects | `symbolaio.{ws}.{service}.{object}.{action}` | Hierarchical, filterable, workspace-scoped |
| Multi-tenancy | `workspace_id` on every row + RLS | PostgreSQL-native isolation |
| 3rd party trust | Separate namespace, no DB access, API-only | Sandboxed by default |
| Operator pattern | kube-rs controller | Rust-native, watches CRDs, reconciliation loop |
