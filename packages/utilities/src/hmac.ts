import crypto from 'crypto';

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Encodes BigInt to base62.
 */
function encodeBase62(num: bigint) {
    if (num === 0n) {
        return CHARSET[0];
    }

    let res = '';
    while (num > 0n) {
        res = CHARSET[Number(num % 62n)] + res;
        num /= 62n;
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

    return encodeBase62(BigInt(`0x${signature}`));
}
