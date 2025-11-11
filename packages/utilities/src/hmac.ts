import crypto from 'node:crypto';

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
 * @deprecated Use {@link createHmacSignatureAsync} instead, which uses Web Crypto API and
 * is available in both Node.js and browsers without the need for polyfills.
 */
export function createHmacSignature(secretKey: string, message: string): string {
    const signature = crypto.createHmac('sha256', secretKey)
        .update(message)
        .digest('hex')
        .substring(0, 30);

    return encodeBase62(BigInt(`0x${signature}`));
}

let webcrypto = globalThis.crypto?.subtle;

async function ensureCryptoSubtleExists() {
    // this might happen in Node.js versions < 19
    webcrypto ??= (await import('node:crypto')).webcrypto.subtle as typeof webcrypto;
}

/**
 * Generates an HMAC signature and encodes it using Base62.
 * Base62 encoding reduces the signature length.
 *
 * @param secretKey {string} Secret key used for signing signatures
 * @param message {string} Message to be signed
 * @returns Promise<string>
 */
export async function createHmacSignatureAsync(secretKey: string, message: string): Promise<string> {
    await ensureCryptoSubtleExists();
    const encoder = new TextEncoder();

    const key = await webcrypto.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signatureBuffer = await webcrypto.sign(
        'HMAC',
        key,
        encoder.encode(message),
    );

    const signatureArray = new Uint8Array(signatureBuffer);
    const signatureHex = Array.from(signatureArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 30);

    return encodeBase62(BigInt(`0x${signatureHex}`));
}
