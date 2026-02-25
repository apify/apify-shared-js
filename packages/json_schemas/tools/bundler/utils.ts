/* eslint-disable no-console */
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { JsonSchemaObject, JsonSchemaValue } from './types';

function isPlainJsonObject(input: unknown): boolean {
    return typeof input === 'object'
        && input !== null
        && !Array.isArray(input)
        && Object.getPrototypeOf(input) === Object.prototype;
}

interface ObjectPropertyInfo<T =JsonSchemaValue> {
    key: string,
    value: T;
    jsonPointer: string;
    parent?: ObjectPropertyInfo<JsonSchemaObject>;
}

function* iterateJsonProperties(input: JsonSchemaObject, parentJsonPath = ''): Generator<ObjectPropertyInfo> {
    if (isPlainJsonObject(input)) {
        for (const [key, value] of Object.entries(input)) {
            const jsonPointer = `${parentJsonPath}/${key}`;
            const parentKey = `${parentJsonPath}`.split(/\//g).pop()!;

            for (const val of [value].flatMap((v) => v)) {
                const objectValue = val as JsonSchemaObject;
                yield ({
                    key,
                    value: objectValue,
                    jsonPointer,
                    parent: parentJsonPath ? {
                        key: parentKey,
                        value: input,
                        jsonPointer: parentJsonPath,
                    } : undefined,
                });

                for (const result of iterateJsonProperties(objectValue, jsonPointer)) {
                    yield result;
                }
            }
        }
    }
}

function md5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

async function includeJsonByPath(absolutePath: string): Promise<JsonSchemaObject> {
    try {
        return JSON.parse(await fs.readFile(absolutePath, 'utf8'));
    } catch (error) {
        throw new Error(`Failed to read/parse "${absolutePath}": ${error instanceof Error ? error.message : 'unknown error'}`);
    }
}

export async function bundleJsonSchema(
    filePath: string,
    jsonSchema?: JsonSchemaObject,
): Promise<JsonSchemaObject> {
    jsonSchema ??= await includeJsonByPath(filePath);

    if (!jsonSchema) {
        throw new Error(`Cannot find schema at "${filePath}"!`);
    }

    if (!isPlainJsonObject(jsonSchema)) {
        return jsonSchema;
    }

    return await scopeJsonSchema(filePath, jsonSchema, jsonSchema);
}

export async function scopeJsonSchema(
    filePath: string,
    mainJsonSchema: JsonSchemaObject,
    jsonSchema: JsonSchemaObject,
    prefix = '',
): Promise<JsonSchemaObject> {
    const REF_ATTRIBUTE = '$ref';

    // Root-level $ref is not supported
    if (REF_ATTRIBUTE in jsonSchema) {
        throw new Error('Attribute $ref in root is not supported');
    }

    for (const { value, jsonPointer, parent, key } of iterateJsonProperties(jsonSchema)) {
        if (parent?.value && key === REF_ATTRIBUTE && value && typeof value === 'string'
        ) {
            const [refRelativeFilePath, anchorPath] = value.trim().split('#');

            if (!refRelativeFilePath && value.startsWith('#')) {
                // Local reference
                const [, localAnchorPath] = value.trim().split('#');
                parent.value[REF_ATTRIBUTE] = `#`;
                if (prefix) {
                    parent.value[REF_ATTRIBUTE] += `${prefix}`;
                }
                parent.value[REF_ATTRIBUTE] += `${localAnchorPath}`;
            } else if (refRelativeFilePath) {
                // External reference (could be a local file path or an absolute URL)
                const isUrl = /^https?:\/\//.test(refRelativeFilePath);
                const externalSchemaAbsolutePath = isUrl
                    ? refRelativeFilePath
                    : path.resolve(path.dirname(filePath), refRelativeFilePath);

                const externalSchemaFilename = isUrl
                    ? externalSchemaAbsolutePath
                    : path.basename(externalSchemaAbsolutePath);

                // Use the filename (or URL) for the hash to keep definition keys
                // stable across machines (absolute paths differ in CI vs local).
                const hashInput = isUrl ? externalSchemaAbsolutePath : externalSchemaFilename;
                const defKey = externalSchemaFilename
                    .replace(/^https?:\/\//gi, '')
                    .replace(/[\W_]/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .concat('-', md5(hashInput));

                mainJsonSchema.definitions ??= {};

                parent.value[REF_ATTRIBUTE] = `#/definitions/${defKey}`;
                if (anchorPath) {
                    // Avoiding double slash in a resulting pointer
                    parent.value[REF_ATTRIBUTE] += `/${anchorPath.replace(/^\/+/, '')}`;
                }

                if (mainJsonSchema.definitions[defKey]) {
                    // already exists
                    continue;
                }

                const externalSchema = await includeJsonByPath(externalSchemaAbsolutePath);
                mainJsonSchema.definitions[defKey] = await scopeJsonSchema(
                    externalSchemaAbsolutePath,
                    mainJsonSchema,
                    externalSchema,
                    `/definitions/${defKey}${(anchorPath || '')}`,
                );
            } else {
                console.error('Invalid reference: ', jsonPointer, value);
            }
        }
    }

    return jsonSchema;
}
