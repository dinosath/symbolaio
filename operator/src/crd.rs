use kube::CustomResource;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// CRD: SymbolaioService — defines a service and its API specs.
#[derive(CustomResource, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[kube(
    group = "symbolaio.io",
    version = "v1alpha1",
    kind = "SymbolaioService",
    namespaced,
    status = "SymbolaioServiceStatus"
)]
pub struct SymbolaioServiceSpec {
    /// Workspace this service belongs to.
    pub workspace_id: String,

    /// Service endpoints.
    pub endpoints: ServiceEndpoints,

    /// URLs to API specification documents.
    #[serde(default)]
    pub specs: ServiceSpecs,

    /// Widget definitions provided by this service.
    #[serde(default)]
    pub widgets: Vec<WidgetSpec>,

    /// Data objects this service manages.
    #[serde(default)]
    pub objects: Vec<ObjectSpec>,

    /// Capabilities this service exposes.
    #[serde(default)]
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ServiceEndpoints {
    pub grpc: Option<String>,
    pub rest: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, JsonSchema)]
pub struct ServiceSpecs {
    pub openapi: Option<String>,
    pub asyncapi: Option<String>,
    pub proto: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WidgetSpec {
    pub name: String,
    #[serde(rename = "type")]
    pub widget_type: String,
    pub bundle: Option<String>,
    #[serde(default)]
    pub config_schema: BTreeMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ObjectSpec {
    pub name: String,
    pub schema: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SymbolaioServiceStatus {
    pub registered: bool,
    pub service_id: Option<String>,
    pub last_synced: Option<String>,
    pub message: Option<String>,
}
