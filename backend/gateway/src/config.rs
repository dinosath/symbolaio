pub struct AppConfig {
    pub database_url: String,
    pub nats_url: String,
    pub jwt_secret: String,
    pub identity_grpc_addr: String,
    pub gateway_addr: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://symbolaio:symbolaio@localhost:5432/symbolaio".into()),
            nats_url: std::env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".into()),
            jwt_secret: std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".into()),
            identity_grpc_addr: std::env::var("IDENTITY_GRPC_ADDR")
                .unwrap_or_else(|_| "http://127.0.0.1:50051".into()),
            gateway_addr: std::env::var("GATEWAY_ADDR")
                .unwrap_or_else(|_| "0.0.0.0:8080".into()),
        }
    }
}
