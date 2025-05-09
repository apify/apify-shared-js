import { KeyObject } from 'node:crypto';

import _testOw, { type Ow } from 'ow';

import { privateDecrypt, publicEncrypt } from '@apify/utilities';

// eslint-disable-next-line no-underscore-dangle
declare const __injectedOw: Ow;

const ow: Ow = typeof __injectedOw === 'undefined' ? _testOw : __injectedOw || _testOw;

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

    const decryptedInput = {} as Record<string, any>;
    for (const [key, value] of Object.entries(input)) {
        if (ow.isValid(value, ow.string) && ENCRYPTED_INPUT_VALUE_REGEXP.test(value)) {
            const match = value.match(ENCRYPTED_INPUT_VALUE_REGEXP);
            if (!match) continue;
            const [, encryptedPassword, encryptedValue] = match;
            try {
                decryptedInput[key] = privateDecrypt({ privateKey, encryptedPassword, encryptedValue });
            } catch (err) {
                throw new Error(`The input field "${key}" could not be decrypted. Try updating the field's value in the input editor. `
                + `Decryption error: ${err}`);
            }
        }
    }

    return { ...input, ...decryptedInput };
}
