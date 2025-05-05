use crate::models::config::{Config, CONFIG_LIST};
use axum::debug_handler;
use axum::routing::post;
use axum::Json;
use loco_rs::controller::{bad_request, format, Routes};
use loco_rs::prelude::{Response};
use loco_rs::{Error, Result};
use reqwest::Client;
use sea_orm::ColIdx;
use serde::{Deserialize, Serialize};
use tempfile::TempDir;
use tokio::process::Command;

#[derive(Deserialize)]
struct ValidateRequest {
    url: String,
    branch_or_tag: Option<String>,
}
#[derive(Deserialize)]
struct ScaffoldRequest {
    template: Template,
    output: TemplateOutput,
    answers: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
struct TemplateOutput {
    kind: TemplateOutputKind
}

#[derive(Serialize, Deserialize)]
enum TemplateOutputKind {
    Zip
}

#[derive(Serialize, Deserialize)]
struct Template {
    url: String,
    path: Option<String>,
    branch_or_tag: Option<String>,
}

#[debug_handler]
async fn validate(Json(request): Json<ValidateRequest>) -> Result<Response> {
    let client = Client::new();
    let base_url = if request.url.contains("github.com") {
        request
            .url
            .replace("github.com", "raw.githubusercontent.com")
            .replace("/blob/", "/")
            + &format!("/{}/", request.branch_or_tag.as_deref().unwrap_or("main"))
    } else {
        format!("{}/", request.url.trim_end_matches('/'))
    };

    for config_file in CONFIG_LIST {
        let file_url = format!("{}{}", base_url, config_file);
        let response = client.get(&file_url).send().await;

        if let Ok(resp) = response {
            if resp.status().is_success() {
                let file_contents = resp.text().await.map_err(|e| {
                    Error::string(
                        format!("Failed to read {} contents: {}", config_file, e).as_str(),
                    )
                })?;

                let config: Config = match *config_file {
                    "baker.json" => serde_json::from_str(&file_contents).map_err(|e| {
                        Error::string(format!("Failed to parse {}: {}", config_file, e).as_str())
                    })?,
                    "baker.yaml" | "baker.yml" => {
                        serde_yaml::from_str(&file_contents).map_err(|e| {
                            Error::string(
                                format!("Failed to parse {}: {}", config_file, e).as_str(),
                            )
                        })?
                    }
                    _ => unreachable!(),
                };

                return Ok(format::json(config)?);
            }
        }
    }

    bad_request("baker file not found or inaccessible")
}

#[debug_handler]
async fn scaffold(Json(request): Json<ScaffoldRequest>) -> Result<Response> {
    let mut tmpdir: TempDir = tempfile::tempdir_in(".")?;
    let path = tmpdir.path();
    println!("Generating code to dit: {:?}", path);

    let answers_arg=format!("--answers={:?}", serde_json::to_string(&request.answers)?);
    println!("answers_arg:{}", answers_arg);
    let output = Command::new("baker")
        .arg(request.template.url.as_str())
        .arg(path)
        .arg("--force")
        .arg(answers_arg)
        .arg("--skip-confirms=all")
        .output()
        .await
        .map_err(|e| Error::string(format!("Failed to execute baker CLI: {}", e).as_str()))?;

    if !output.status.success() {
        return bad_request(format!(
            "baker CLI failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(format::json(String::from_utf8_lossy(&output.stdout))?)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/templates")
        .add("/", post(scaffold))
        .add("/validate", post(validate))
}
