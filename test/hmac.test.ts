import { createHmacSignature } from '@apify/utilities';

describe('createHmacSignature()', () => {
    it('should create a valid HMAC signature', () => {
        const secretKey = 'hmac-secret-key';
        const message = 'hmac-message-to-be-authenticated';
        expect(createHmacSignature(secretKey, message)).toBe('pcVagAsud2gqKY2qCy2G');
    });

    it('should create same HMAC signature, when secretKey and message are same', () => {
        const secretKey = 'hmac-same-secret-key';
        const message = 'hmac-same-message-to-be-authenticated';
        for (let i = 0; i < 5; i++) {
            expect(createHmacSignature(secretKey, message)).toBe('FYMcmTIm2sQ68EcG8yyQ');
        }
    });
});
