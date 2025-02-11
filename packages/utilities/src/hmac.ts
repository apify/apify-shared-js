import crypto from 'crypto';

import base62 from 'base62';

/**
 * Generates an HMAC signature and encodes it using Base62.
 * Base62 encoding reduces the signature length.
 *
 * @param secretKey {string} Secret key used for signing signatures
 * @param message {string} Message to be signed
 * @returns string
 */
export function createHmacSignature(secretKey: string, message: string): string {
    const signature = crypto.createHmac('sha256', secretKey)
        .update(message)
        .digest('hex')
        .substring(0, 30);

    return base62.encode(parseInt(signature, 16));
}
