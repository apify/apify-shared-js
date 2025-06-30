import crypto from 'node:crypto';

/**
 * These keys are omitted from the field schema normalization process
 * because they are not relevant for validation of values against the schema.
 */
const OMIT_KEYS = new Set(['title', 'description', 'sectionCaption', 'sectionDescription', 'nullable', 'example', 'editor']);

/**
 * Normalizes the field schema by removing irrelevant keys and sorting the remaining keys.
 */
function normalizeFieldSchema(value: any): any {
    if (Array.isArray(value)) {
        return value.map(normalizeFieldSchema);
    }

    if (value && typeof value === 'object') {
        const result: Record<string, any> = {};
        Object.keys(value)
            .filter((key) => !OMIT_KEYS.has(key))
            .sort()
            .forEach((key) => {
                result[key] = normalizeFieldSchema(value[key]);
            });
        return result;
    }

    return value;
}

/**
 * Generates a stable hash for the field schema.
 * @param fieldSchema
 */
export function getFieldSchemaHash(fieldSchema: Record<string, any>): string {
    try {
        const stringifiedSchema = JSON.stringify(normalizeFieldSchema(fieldSchema));
        // Create a SHA-256 hash of the stringified schema and return the first 10 characters in hex.
        return crypto.createHash('sha256').update(stringifiedSchema).digest('hex').slice(0, 10);
    } catch (err) {
        throw new Error(`The field schema could not be stringified for hash: ${err}`);
    }
}
