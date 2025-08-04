import { createHmacSignature } from './hmac';

/**
 * Creates a secure signature for a resource like a dataset or key-value store.
 * This signature is used to generate a signed URL for authenticated access, which can be expiring or permanent.
 * The signature is created using HMAC with the provided secret key and includes the resource ID, expiration time, and version.
 *
 * Note: expirationMillis is optional. If not provided, the signature will not expire.
 */
export function createStorageContentSignature({
    resourceId,
    urlSigningSecretKey,
    expiresInMillis,
    version = 0,
}: {
    resourceId: string;
    urlSigningSecretKey: string;
    expiresInMillis: number | undefined;
    version?: number;
}) {
    const expiresAt = expiresInMillis ? new Date().getTime() + expiresInMillis : 0;
    const hmac = createHmacSignature(urlSigningSecretKey, `${version}.${expiresAt}.${resourceId}`);
    return Buffer.from(`${version}.${expiresAt}.${hmac}`).toString('base64url');
}
