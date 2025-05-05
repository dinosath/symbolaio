use std::collections::HashMap;
use serde::{Deserialize, Serialize};

pub const CONFIG_LIST: &[&str] = &["baker.json", "baker.yaml", "baker.yml"];

/// Type of question to be presented to the user
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Type {
    /// String input question type
    Str,
    /// Boolean (yes/no) question type
    Bool,
    /// JSON structured input type
    Json,
    /// YAML structured input type
    Yaml,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct Secret {
    /// Whether the secret should have confirmation
    #[serde(default)]
    pub confirm: bool,
    #[serde(default)]
    pub mistmatch_err: String,
}

#[derive(Debug, Deserialize)]
pub struct Validation {
    #[serde(default)]
    pub condition: String,
    #[serde(default = "get_default_error_message")]
    pub error_message: String,
}

fn get_default_condition() -> String {
    "true".to_string()
}

fn get_default_error_message() -> String {
    "Invalid answer".to_string()
}

/// Represents a single question in the configuration
#[derive(Debug, Serialize, Deserialize)]
pub struct Question {
    /// Help text/prompt to display to the user
    #[serde(default)]
    pub help: String,
    /// Type of the question (string or boolean)
    #[serde(rename = "type")]
    pub r#type: Type,
    /// Optional default value for the question
    #[serde(default)]
    pub default: serde_json::Value,
    /// Available choices for string questions
    #[serde(default)]
    pub choices: Vec<String>,
    /// Available option for string questions
    #[serde(default)]
    pub multiselect: bool,
    /// Whether the string is a secret
    #[serde(default)]
    pub secret: Option<Secret>,
    #[serde(default)]
    pub ask_if: String,
    /// JSON Schema for validation (for Json and Yaml types)
    #[serde(default)]
    pub schema: Option<String>,
}

/// Main configuration structure holding all questions
#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigV1 {
    #[serde(default)]
    pub questions: HashMap<String, Question>,
    #[serde(default = "get_default_post_hook_filename")]
    pub post_hook_filename: String,
    #[serde(default = "get_default_pre_hook_filename")]
    pub pre_hook_filename: String,
}

fn get_default_post_hook_filename() -> String {
    "post".to_string()
}

fn get_default_pre_hook_filename() -> String {
    "pre".to_string()
}

fn get_default_validation() -> Validation {
    Validation {
        condition: get_default_condition(),
        error_message: get_default_error_message(),
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "schemaVersion")]
pub enum Config {
    #[serde(rename = "v1")]
    V1(ConfigV1),
}

#[derive(Debug, PartialEq)]
pub enum QuestionType {
    MultipleChoice,
    SingleChoice,
    Text,
    Boolean,
    Json,
    Yaml,
}

#[derive(Debug)]
pub struct QuestionRendered {
    pub ask_if: bool,
    pub default: serde_json::Value,
    pub help: String,
    pub r#type: QuestionType,
}
