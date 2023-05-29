import ow from 'ow';
import { KeyObject } from 'crypto';
import { privateDecrypt, publicEncrypt } from '@apify/utilities';

const BASE64_REGEXP = /[-A-Za-z0-9+/]*={0,3}/;
const ENCRYPTED_INPUT_VALUE_PREFIX = 'ENCRYPTED_VALUE';
const ENCRYPTED_INPUT_VALUE_REGEXP = new RegExp(`^${ENCRYPTED_INPUT_VALUE_PREFIX}:(${BASE64_REGEXP.source}):(${BASE64_REGEXP.source})$`);

/**
 * Get keys of secret fields from input schema
 */
export function getInputSchemaSecretFieldKeys(inputSchema: any): string[] {
    return Object.keys(inputSchema.properties)
        .filter((key) => !!inputSchema.properties[key].isSecret);
}

/**
 * Encrypts input secret value
 */
export function encryptInputSecretValue({ value, publicKey }: { value: string, publicKey: KeyObject }): string {
    ow(value, ow.string);
    ow(publicKey, ow.object.instanceOf(KeyObject));

    const { encryptedValue, encryptedPassword } = publicEncrypt({ value, publicKey });
    return `${ENCRYPTED_INPUT_VALUE_PREFIX}:${encryptedPassword}:${encryptedValue}`;
}

/**
 * Encrypts actor input secrets
 */
export function encryptInputSecrets<T>(
    { input, inputSchema, publicKey }: { input: T, inputSchema: object, publicKey: KeyObject },
): T {
    ow(input, ow.object);
    ow(inputSchema, ow.object);
    ow(publicKey, ow.object.instanceOf(KeyObject));

    const secretsInInputKeys = getInputSchemaSecretFieldKeys(inputSchema);
    if (secretsInInputKeys.length === 0) return input;

    const encryptedInput = {};
    for (const key of secretsInInputKeys) {
        const value = input[key];
        // NOTE: Skips already encrypted values. It can happens in case client already encrypted values, before
        // sending them using API. Or input was takes from task, run console or scheduler, where input is stored encrypted.
        if (value && ow.isValid(value, ow.string) && !ENCRYPTED_INPUT_VALUE_REGEXP.test(value)) {
            encryptedInput[key] = encryptInputSecretValue({ value: input[key], publicKey });
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

    const decryptedInput = {};
    for (const [key, value] of Object.entries(input)) {
        if (ow.isValid(value, ow.string) && ENCRYPTED_INPUT_VALUE_REGEXP.test(value)) {
            const match = value.match(ENCRYPTED_INPUT_VALUE_REGEXP);
            if (!match) continue;
            const [, encryptedPassword, encryptedValue] = match;
            decryptedInput[key] = privateDecrypt({ privateKey, encryptedPassword, encryptedValue });
        }
    }

    return { ...input, ...decryptedInput };
}
