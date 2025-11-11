import { createHmacSignature, createHmacSignatureAsync } from './hmac';

/**
 * Creates a secure signature for a resource like a dataset or key-value store.
 * This signature is used to generate a signed URL for authenticated access, which can be expiring or permanent.
 * The signature is created using HMAC with the provided secret key and includes the resource ID, expiration time, and version.
 *
 * Note: expiresInMillis is optional. If not provided, the signature will not expire.
 *
 * @deprecated Use {@link createStorageContentSignatureAsync} instead, which uses Web Crypto API and
 * is available in both Node.js and browsers without the need for polyfills.
 */
export function createStorageContentSignature({
    resourceId,
    urlSigningSecretKey,
    expiresInMillis,
    version = 0,
}: {
    resourceId: string;
    urlSigningSecretKey: string;
    expiresInMillis?: number;
    version?: number;
}) {
    const expiresAt = expiresInMillis ? new Date().getTime() + expiresInMillis : 0;
    const hmac = createHmacSignature(urlSigningSecretKey, `${version}.${expiresAt}.${resourceId}`);
    return Buffer.from(`${version}.${expiresAt}.${hmac}`).toString('base64url');
}

function typedArrayToBase64Url(typedArray: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < typedArray.length; i++) {
        binary += String.fromCharCode(typedArray[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Creates a secure signature for a resource like a dataset or key-value store.
 * This signature is used to generate a signed URL for authenticated access, which can be expiring or permanent.
 * The signature is created using HMAC with the provided secret key and includes the resource ID, expiration time, and version.
 *
 * Note: expiresInMillis is optional. If not provided, the signature will not expire.
 */
export async function createStorageContentSignatureAsync({
    resourceId,
    urlSigningSecretKey,
    expiresInMillis,
    version = 0,
}: {
    resourceId: string;
    urlSigningSecretKey: string;
    expiresInMillis?: number;
    version?: number;
}): Promise<string> {
    const expiresAt = expiresInMillis ? new Date().getTime() + expiresInMillis : 0;
    const hmac = await createHmacSignatureAsync(urlSigningSecretKey, `${version}.${expiresAt}.${resourceId}`);
    return typedArrayToBase64Url(new TextEncoder().encode(`${version}.${expiresAt}.${hmac}`));
}
