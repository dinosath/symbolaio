use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A platform event published to NATS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub service: String,
    pub object: String,
    pub action: String,
    pub entity_id: Uuid,
    pub payload: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

impl Event {
    pub fn new(
        workspace_id: Uuid,
        service: &str,
        object: &str,
        action: &str,
        entity_id: Uuid,
        payload: serde_json::Value,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            workspace_id,
            service: service.to_string(),
            object: object.to_string(),
            action: action.to_string(),
            entity_id,
            payload,
            timestamp: Utc::now(),
        }
    }

    /// NATS subject: symbolaio.{workspace_id}.{service}.{object}.{action}
    pub fn subject(&self) -> String {
        format!(
            "symbolaio.{}.{}.{}.{}",
            self.workspace_id, self.service, self.object, self.action
        )
    }
}

/// Thin wrapper around a NATS client for publishing events.
#[derive(Clone)]
pub struct EventBus {
    client: async_nats::Client,
}

impl EventBus {
    pub async fn connect(url: &str) -> Result<Self> {
        let client = async_nats::connect(url).await?;
        tracing::info!("Connected to NATS at {url}");
        Ok(Self { client })
    }

    pub async fn publish(&self, event: &Event) -> Result<()> {
        let subject = event.subject();
        let payload = serde_json::to_vec(event)?;
        self.client
            .publish(subject.clone(), payload.into())
            .await?;
        tracing::debug!(subject = %subject, event_id = %event.id, "Event published");
        Ok(())
    }

    pub async fn subscribe(
        &self,
        subject: &str,
    ) -> Result<async_nats::Subscriber> {
        let sub = self.client.subscribe(subject.to_string()).await?;
        Ok(sub)
    }
}

/// A no-op event bus for testing without NATS.
#[derive(Clone, Default)]
pub struct NoopEventBus;

impl NoopEventBus {
    pub async fn publish(&self, event: &Event) -> Result<()> {
        tracing::debug!(subject = %event.subject(), "Event published (noop)");
        Ok(())
    }
}
