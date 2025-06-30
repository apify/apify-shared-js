import { KeyObject } from 'node:crypto';

import _testOw, { type Ow } from 'ow';

import { privateDecrypt, publicEncrypt } from '@apify/utilities';

import { getFieldSchemaHash } from './field_schema_utils';

// eslint-disable-next-line no-underscore-dangle
declare const __injectedOw: Ow;

const ow: Ow = typeof __injectedOw === 'undefined' ? _testOw : __injectedOw || _testOw;

const BASE64_REGEXP = /[-A-Za-z0-9+/]*={0,3}/;

// The encrypted value has a prefix, optional schema hash, encrypted password and encrypted value.
// - The prefix tells if the value is a string or a JSON object and needs to be parsed back after decryption.
// - The schema hash is optional and is used to verify if the schema has changed since the value was encrypted.
// - The encrypted password is used to decrypt the value.
// - The encrypted value is the actual encrypted data.

// used for backward compatibility with old encrypted string values
const ENCRYPTED_STRING_VALUE_PREFIX = 'ENCRYPTED_VALUE';
// we use this for all types of encrypted values (string, object, array)
const ENCRYPTED_JSON_VALUE_PREFIX = 'ENCRYPTED_JSON';

// All encrypted values must match this regular expression.
const ENCRYPTED_VALUE_REGEXP = new RegExp(`^(${ENCRYPTED_STRING_VALUE_PREFIX}|${ENCRYPTED_JSON_VALUE_PREFIX}):(?:(${BASE64_REGEXP.source}):)?(${BASE64_REGEXP.source}):(${BASE64_REGEXP.source})$`);

/**
 * Get keys of secret fields from input schema
 */
export function getInputSchemaSecretFieldKeys(inputSchema: any): string[] {
    return Object.keys(inputSchema.properties)
        .filter((key) => !!inputSchema.properties[key].isSecret);
}

/**
 * Encrypts input secret value
 * Depending on the type of value, it returns either a string (for strings) or an object (for objects) with the `secret` key.
 */
export function encryptInputSecretValue<T extends string | object>(
    { value, publicKey, schema }: { value: T, publicKey: KeyObject, schema?: Record<string, any> },
): string {
    ow(value, ow.any(ow.string, ow.object));
    ow(publicKey, ow.object.instanceOf(KeyObject));
    ow(schema, ow.optional.object);

    const schemaHash = schema ? getFieldSchemaHash(schema) : null;

    // We are encrypting the value as a JSON string, so we need to stringify it first.
    let valueStr: string;
    try {
        valueStr = JSON.stringify(value);
    } catch (err) {
        throw new Error(`The input value could not be stringified for encryption: ${err}`);
    }

    const { encryptedValue, encryptedPassword } = publicEncrypt({ value: valueStr, publicKey });
    return `${ENCRYPTED_JSON_VALUE_PREFIX}:${schemaHash ? `${schemaHash}:` : ''}${encryptedPassword}:${encryptedValue}`;
}

/**
 * Checks if the value is an encrypted value for a specific field type.
 * It validates the string value against the regular expression and checks the prefix.
 * @param value - encrypted value to check
 * @param fieldType - type of the field, can be 'string', 'object' or 'array'
 */
export function isEncryptedValueForFieldType(value: string, fieldType: 'string' | 'object' | 'array') {
    ow(value, ow.string);
    ow(fieldType, ow.string.oneOf(['string', 'object', 'array']));

    const match = value.match(ENCRYPTED_VALUE_REGEXP);
    if (!match) return false;

    const [, prefix] = match;

    // For backward compatibility, we allow the old prefix only for string values.
    if (['string'].includes(fieldType) && prefix !== ENCRYPTED_STRING_VALUE_PREFIX) return false;

    return true;
}

/**
 * Checks if the value is an encrypted value for a specific field schema.
 * It validates the string value against the regular expression and checks the schema hash in
 * the encrypted value against the hash of the field schema.
 * @param value - encrypted value to check
 * @param fieldSchema - schema of the field, used to get the hash
 */
export function isEncryptedValueForFieldSchema(value: string, fieldSchema: Record<string, any>) {
    ow(value, ow.string);
    ow(fieldSchema, ow.object);

    const match = value.match(ENCRYPTED_VALUE_REGEXP);
    if (!match) return false;

    const [, prefix, schemaHash] = match;

    if (prefix !== ENCRYPTED_STRING_VALUE_PREFIX && prefix !== ENCRYPTED_JSON_VALUE_PREFIX) return false;

    if (schemaHash) {
        const fieldSchemaHash = getFieldSchemaHash(fieldSchema);
        return schemaHash === fieldSchemaHash;
    }

    return true;
}

/**
 * Encrypts actor input secrets
 */
export function encryptInputSecrets<T extends Record<string, any>>(
    { input, inputSchema, publicKey }: { input: T, inputSchema: object, publicKey: KeyObject },
): T {
    ow(input, ow.object);
    ow(inputSchema, ow.object);
    ow(publicKey, ow.object.instanceOf(KeyObject));

    const secretsInInputKeys = getInputSchemaSecretFieldKeys(inputSchema);
    if (secretsInInputKeys.length === 0) return input;

    const encryptedInput = {} as Record<string, any>;
    for (const key of secretsInInputKeys) {
        const value = input[key];
        // NOTE: Skips already encrypted values. It can happens in case client already encrypted values, before
        // sending them using API. Or input was takes from task, run console or scheduler, where input is stored encrypted.
        if (value && !(ow.isValid(value, ow.string) && ENCRYPTED_VALUE_REGEXP.test(value))) {
            try {
                encryptedInput[key] = encryptInputSecretValue({ value: input[key], publicKey, schema: (inputSchema as any).properties[key] });
            } catch (err) {
                throw new Error(`The input field "${key}" could not be encrypted. Try updating the field's value in the input editor. `
                    + `Encryption error: ${err}`);
            }
        }
    }

    return { ...input, ...encryptedInput };
}

/**
 * Decrypts actor input secrets
 * @param {Object} input
 * @param {KeyObject} privateKey
 * @returns Object
 */
export function decryptInputSecrets<T>(
    { input, privateKey }: { input: T, privateKey: KeyObject },
): T {
    ow(input, ow.object);
    ow(privateKey, ow.object.instanceOf(KeyObject));

    const decryptedInput = {} as Record<string, any>;
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string' && ENCRYPTED_VALUE_REGEXP.test(value)) {
            const match = value.match(ENCRYPTED_VALUE_REGEXP);
            if (!match) continue;
            const [, prefix, , encryptedPassword, encryptedValue] = match;
            try {
                const decryptedValue = privateDecrypt({ privateKey, encryptedPassword, encryptedValue });

                if (prefix === ENCRYPTED_STRING_VALUE_PREFIX) {
                    decryptedInput[key] = decryptedValue;
                } else if (prefix === ENCRYPTED_JSON_VALUE_PREFIX) {
                    // For JSON values, we need to parse the decrypted string into an object.
                    decryptedInput[key] = JSON.parse(decryptedValue);
                }
            } catch (err) {
                throw new Error(`The input field "${key}" could not be decrypted. Try updating the field's value in the input editor. `
                + `Decryption error: ${err}`);
            }
        }
    }

    return { ...input, ...decryptedInput };
}
