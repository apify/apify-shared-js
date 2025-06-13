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
 * Depending on the type of value, it returns either a string (for strings) or an object (for objects) with the `secret` key.
 */
export function encryptInputSecretValue<T extends string | object>({ value, publicKey }: { value: T, publicKey: KeyObject }):
    T extends string ? string : { secret: string } {
    ow(value, ow.any(ow.string, ow.object));
    ow(publicKey, ow.object.instanceOf(KeyObject));

    type ResultType = T extends string ? string : { secret: string };

    if (typeof value === 'string') {
        const { encryptedValue, encryptedPassword } = publicEncrypt({ value, publicKey });
        return `${ENCRYPTED_INPUT_VALUE_PREFIX}:${encryptedPassword}:${encryptedValue}` as ResultType;
    }

    let valueStr: string;
    try {
        valueStr = JSON.stringify(value);
    } catch (err) {
        throw new Error(`The input value could not be stringified for encryption: ${err}`);
    }
    // For objects, we return an object with the encrypted JSON string under the 'secret' key.
    const encryptedJSONString = encryptInputSecretValue({ value: valueStr, publicKey });
    return { secret: encryptedJSONString } as ResultType;
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
        const isUnencryptedString = ow.isValid(value, ow.string) && !ENCRYPTED_INPUT_VALUE_REGEXP.test(value);
        const isUnencryptedObject = ow.isValid(value, ow.object)
            && (typeof (value as any).secret !== 'string' || !ENCRYPTED_INPUT_VALUE_REGEXP.test((value as any).secret));

        if (isUnencryptedString || isUnencryptedObject) {
            try {
                encryptedInput[key] = encryptInputSecretValue({ value: input[key], publicKey });
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
        const isEncryptedString = typeof value === 'string' && ENCRYPTED_INPUT_VALUE_REGEXP.test(value);
        const isEncryptedObject = typeof value === 'object' && typeof (value as any).secret === 'string'
            && ENCRYPTED_INPUT_VALUE_REGEXP.test((value as any).secret);

        if (isEncryptedString) {
            const match = value.match(ENCRYPTED_INPUT_VALUE_REGEXP);
            if (!match) continue;
            const [, encryptedPassword, encryptedValue] = match;
            try {
                decryptedInput[key] = privateDecrypt({ privateKey, encryptedPassword, encryptedValue });
            } catch (err) {
                throw new Error(`The input field "${key}" could not be decrypted. Try updating the field's value in the input editor. `
                + `Decryption error: ${err}`);
            }
        } else if (isEncryptedObject) {
            // For objects, we are passing the encrypted object with `secret` key as an input to decryption.
            // So we extract the encrypted JSON string and can construct the decrypted object.
            const decryptedJSONString = decryptInputSecrets({ input: { [key]: (value as any).secret }, privateKey })[key];
            try {
                decryptedInput[key] = JSON.parse(decryptedJSONString);
            } catch (err) {
                throw new Error(`The input field "${key}" could not be parsed as JSON after decryption: ${err}`);
            }
        }
    }

    return { ...input, ...decryptedInput };
}
