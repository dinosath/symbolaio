use axum::{
    extract::Request,
    http::{self, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

/// Extracted auth context available in handlers.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub email: String,
}

/// Extract auth user from request extensions (set by middleware).
pub fn extract_auth(req: &Request) -> Option<AuthUser> {
    req.extensions().get::<AuthUser>().cloned()
}

/// Axum middleware that validates JWT and injects AuthUser into extensions.
pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".into());

    let auth_header = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok());

    if let Some(header) = auth_header {
        if let Some(token) = header.strip_prefix("Bearer ") {
            if let Ok(data) = decode::<Claims>(
                token,
                &DecodingKey::from_secret(jwt_secret.as_bytes()),
                &Validation::default(),
            ) {
                if let Ok(user_id) = data.claims.sub.parse::<Uuid>() {
                    req.extensions_mut().insert(AuthUser {
                        user_id,
                        email: data.claims.email,
                    });
                }
            }
        }
    }

    Ok(next.run(req).await)
}
