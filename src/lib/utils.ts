import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { JSONSchema7 } from "json-schema";

export type ChangeType = "major" | "minor" | "none";

export const compareJsonSchemas = (oldSchema: JSONSchema7, newSchema: JSONSchema7): ChangeType => {
    const oldProperties = oldSchema.properties || {};
    const newProperties = newSchema.properties || {};

    const oldKeys = Object.keys(oldProperties);
    const newKeys = Object.keys(newProperties);

    // Check for removed or renamed fields (breaking changes)
    for (const key of oldKeys) {
        if (!newKeys.includes(key)) {
            return "major"; // Field removed or renamed
        }

        // Check if the type of a field has changed (breaking change)
        const oldType = (oldProperties[key] as JSONSchema7).type;
        const newType = (newProperties[key] as JSONSchema7).type;
        if (oldType !== newType) {
            return "major"; // Field type changed
        }
    }

    // Check for added fields (non-breaking changes)
    for (const key of newKeys) {
        if (!oldKeys.includes(key)) {
            return "minor"; // New field added
        }
    }

    // No changes detected
    return "none";
};

export const incrementVersion = (currentVersion: string, changeType: ChangeType): string => {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  if (changeType === "major") {
      return `${major + 1}.0.0`; // Increment major, reset minor and patch
  } else if (changeType === "minor") {
      return `${major}.${minor + 1}.0`; // Increment minor, reset patch
  } else {
      return currentVersion; // No change
  }
};

/**
 * Adds a new field to the schema.
 * @param schema - The current JSON schema.
 * @param fieldName - The name of the new field.
 * @param fieldType - The type of the new field.
 * @returns The updated schema.
 */
export const addFieldToSchema = (
  schema: JSONSchema7,
  fieldName: string,
  fieldType: string
): JSONSchema7 => {
  const updatedSchema = { ...schema };

  // Ensure the properties object exists
  if (!updatedSchema.properties) {
      updatedSchema.properties = {};
  }

  // Add the new field
  updatedSchema.properties[fieldName] = { type: fieldType };

  return updatedSchema;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
