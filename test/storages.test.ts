import { createStorageContentSignature, createStorageContentSignatureAsync, cryptoRandomObjectId } from '@apify/utilities';

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

describe('createStorageContentSignatureAsync()', () => {
    it('should set expiresAt to 0 for a non-expiring signature', async () => {
        const secretKey = 'hmac-secret-key';
        const message = 'resource-id';

        const signature = await createStorageContentSignatureAsync({
            resourceId: message,
            urlSigningSecretKey: secretKey,
        });

        const [version, expiresAt, hmac] = Buffer.from(signature, 'base64url').toString('utf8').split('.');
        expect(signature).toBe('MC4wLjNUd2ZFRTY1OXVmU05zbVM0N2xS');
        expect(version).toBe('0');
        expect(expiresAt).toBe('0');
        expect(hmac).toBe('3TwfEE659ufSNsmS47lR');
    });

    it('should create a signature with a future expiration timestamp when expiresInMillis is provided', async () => {
        const secretKey = 'hmac-secret-key';
        const message = 'resource-id';

        const signature = await createStorageContentSignatureAsync({
            resourceId: message,
            urlSigningSecretKey: secretKey,
            expiresInMillis: 10000,
        });

        const [version, expiresAt] = Buffer.from(signature, 'base64url').toString('utf8').split('.');
        expect(version).toBe('0');
        expect(expiresAt).not.toBe('0');
    });

    it('should create same storage signature for same inputs', async () => {
        for (let i = 0; i < 1e3; i++) {
            const secretKey = cryptoRandomObjectId();
            const resourceId = cryptoRandomObjectId();

            jest.useFakeTimers().setSystemTime(Date.now());

            const syncSignature = createStorageContentSignature({
                resourceId,
                urlSigningSecretKey: secretKey,
                expiresInMillis: 5000,
            });
            const asyncSignature = await createStorageContentSignatureAsync({
                resourceId,
                urlSigningSecretKey: secretKey,
                expiresInMillis: 5000,
            });

            jest.useRealTimers();
            expect(syncSignature).toBe(asyncSignature);
        }
    });
});
