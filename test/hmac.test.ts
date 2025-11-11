import { createHmacSignature, createHmacSignatureAsync, cryptoRandomObjectId } from '@apify/utilities';

describe('createHmacSignature()', () => {
    it('should create a valid HMAC signature', () => {
        const secretKey = 'hmac-secret-key';
        const message = 'hmac-message-to-be-authenticated';
        expect(createHmacSignature(secretKey, message)).toBe('pcVagAsudj8dFqdlg7mG');
    });

    it('should create same HMAC signature, when secretKey and message are same', () => {
        const secretKey = 'hmac-same-secret-key';
        const message = 'hmac-same-message-to-be-authenticated';
        for (let i = 0; i < 5; i++) {
            expect(createHmacSignature(secretKey, message)).toBe('FYMcmTIm3idXqleF1Sw5');
        }
    });
});

describe('createHmacSignatureAsync()', () => {
    it('should create a valid HMAC signature', async () => {
        const secretKey = 'hmac-secret-key';
        const message = 'hmac-message-to-be-authenticated';
        await expect(createHmacSignatureAsync(secretKey, message)).resolves.toBe('pcVagAsudj8dFqdlg7mG');
    });

    it('should create same HMAC signature, when secretKey and message are same', async () => {
        const secretKey = 'hmac-same-secret-key';
        const message = 'hmac-same-message-to-be-authenticated';
        for (let i = 0; i < 5; i++) {
            await expect(createHmacSignatureAsync(secretKey, message)).resolves.toBe('FYMcmTIm3idXqleF1Sw5');
        }
    });

    it('should create same HMAC signature for same inputs', async () => {
        for (let i = 0; i < 1e3; i++) {
            const secretKey = cryptoRandomObjectId();
            const message = cryptoRandomObjectId();

            const syncHmac = createHmacSignature(secretKey, message);
            const asyncHmac = await createHmacSignatureAsync(secretKey, message);

            expect(syncHmac).toBe(asyncHmac);
        }
    });
});
