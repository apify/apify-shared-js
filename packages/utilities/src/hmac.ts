import crypto from 'crypto';

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Encodes number to base62.
 * To avoid new dependency, this function was copied from https://github.com/base62/base62.js/blob/master/lib/ascii.js
 */
function encodeBase62(num: number) {
    if (num === 0) {
        return CHARSET[0];
    }

    let res = '';
    while (num > 0) {
        res = CHARSET[num % 62] + res;
        num = Math.floor(num / 62);
    }
    return res;
}

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

    return encodeBase62(parseInt(signature, 16));
}
