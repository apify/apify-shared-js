import type { JsonObject, JsonValue, ObjectPropertyInfo, Rule } from './types';

/**
 * Parses a JSON Pointer into its constituent parts, decoding escape sequences per RFC 6901.
 */
export function parseJsonPointer(jsonPointer: string): string[] {
    return jsonPointer.replace(/^\//, '')
        .split('/')
        // Decode JSON Pointer escape sequences (RFC 6901):
        // Must decode ~0 first, then ~1 to handle sequences like ~01 correctly
        .map((part) => part.replace(/~0/g, '~').replace(/~1/g, '/'));
}

export function isPlainJsonObject(input: unknown): boolean {
    return typeof input === 'object'
        && input !== null
        && !Array.isArray(input)
        && Object.getPrototypeOf(input) === Object.prototype;
}

function isIterable(input: unknown): boolean {
    return isPlainJsonObject(input) || Array.isArray(input);
}

function* iterateJsonProperties(input: JsonValue, parentJsonPath = ''): Generator<ObjectPropertyInfo> {
    if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            const jsonPointer = `${parentJsonPath}/${i}`;
            for (const result of iterateJsonProperties(input[i], jsonPointer)) {
                yield result;
            }
        }
        return;
    }

    if (!isPlainJsonObject(input)) {
        return;
    }

    if (parentJsonPath === '') {
        yield ({
            value: input,
            jsonPointer: '/',
        });
    }

    if (isPlainJsonObject(input)) {
        const inputObject = input as JsonObject;
        for (const key of Object.keys(inputObject)) {
            const jsonPointer = `${parentJsonPath}/${key}`;
            const parentKey = `${parentJsonPath}`.split(/\//g).pop()!;
            const value = inputObject[key];

            if (isIterable(value)) {
                yield ({
                    key,
                    value,
                    jsonPointer,
                    parent: parentJsonPath ? {
                        key: parentKey,
                        value: inputObject,
                        jsonPointer: parentJsonPath,
                    } : undefined,
                });

                for (const result of iterateJsonProperties(value, jsonPointer)) {
                    yield result;
                }
            } else {
                yield ({
                    key,
                    value,
                    jsonPointer,
                    parent: {
                        key: parentKey,
                        value: inputObject,
                        jsonPointer: parentJsonPath === '' ? '/' : parentJsonPath,
                    },
                });
            }
        }
    }
}

export function getJsonValue<T>(json: JsonObject, jsonPointer: string): { value: T } {
    if (jsonPointer === '/') {
        return {
            get value(): T {
                return json as T;
            },
            set value(newValue: T) {
                for (const key of Object.keys(json)) {
                    delete json[key];
                }
                Object.assign(json, newValue);
            },
        };
    }

    const parts = parseJsonPointer(jsonPointer);

    let current: any = json;
    let parent: any = json;

    const lastPart = parts[parts.length - 1];
    for (const part of parts) {
        if (!(part in current)) {
            throw new Error(`JSON Pointer path not found: ${jsonPointer} (missing segment: "${part}")`);
        }
        parent = current;
        current = current[part];
    }

    return {
        get value(): T {
            return current;
        },
        set value(value: T) {
            parent[lastPart] = value;
        },
    };
}

export function parseJsonContent(jsonContent: string): JsonObject {
    try {
        return JSON.parse(jsonContent); // Check if the file contains parsable JSON.
    } catch {
        throw new Error(`Problem during parsing JSON file!`);
    }
}

function matchesJsonPointer(ruleJsonPointer: string, attributeJsonPointer: string): boolean {
    return ruleJsonPointer === attributeJsonPointer
        // Basic support for using wildcard symbols
        || (
            ruleJsonPointer.startsWith('**')
            && attributeJsonPointer.endsWith(ruleJsonPointer.replace(/^\*\*/, ''))
        );
}

export async function enchantJsonSchema(
    jsonSchema: JsonObject,
    enchantmentRules: Rule[],
): Promise<unknown> {
    if (!isIterable(jsonSchema)) {
        return jsonSchema;
    }

    jsonSchema = JSON.parse(JSON.stringify(jsonSchema)); // deep copy of validation schema

    for (const jsonPropertyInfo of iterateJsonProperties(jsonSchema)) {
        const { jsonPointer } = jsonPropertyInfo;

        const relatedRules = enchantmentRules
            .filter((enchantmentRule) => matchesJsonPointer(enchantmentRule.jsonPath, jsonPointer));

        for (const relatedRule of relatedRules) {
            // eslint-disable-next-line no-underscore-dangle
            relatedRule.__apply(jsonPropertyInfo, jsonSchema);
        }
    }

    return jsonSchema;
}
