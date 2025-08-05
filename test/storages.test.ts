import { createStorageContentSignature } from '@apify/utilities';

describe('createStorageContentSignature()', () => {
    it('should set expiresAt to 0 for a non-expiring signature', () => {
        const secretKey = 'hmac-secret-key';
        const message = 'resource-id';

        const signature = createStorageContentSignature({
            resourceId: message,
            urlSigningSecretKey: secretKey,
        });

        const [version, expiresAt, hmac] = Buffer.from(signature, 'base64url').toString('utf8').split('.');
        expect(signature).toBe('MC4wLjNUd2ZFRTY1OXVmU05zbVM0N2xS');
        expect(version).toBe('0');
        expect(expiresAt).toBe('0');
        expect(hmac).toBe('3TwfEE659ufSNsmS47lR');
    });

    it('should create a signature with a future expiration timestamp when expiresInMillis is provided', () => {
        const secretKey = 'hmac-secret-key';
        const message = 'resource-id';

        const signature = createStorageContentSignature({
            resourceId: message,
            urlSigningSecretKey: secretKey,
            expiresInMillis: 10000,
        });

        const [version, expiresAt] = Buffer.from(signature, 'base64url').toString('utf8').split('.');
        expect(version).toBe('0');
        expect(expiresAt).not.toBe('0');
    });
});
