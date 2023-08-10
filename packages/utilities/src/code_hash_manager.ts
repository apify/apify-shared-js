import { timingSafeEqual, createHmac } from 'node:crypto';

export enum CodeHashMetaKey {
    VERSION = 'v',
    USER = 'u',
}

/**
 * Allows hashing of an Actor input together with some metadata into a shareable link for the "Run on Apify" button.
 * Uses a common secret for checking the signatures.
 *
 * The hash consists of 3 parts separated by a dot, as in `ABC.DEF.GHI`, each being a base64url encoded string:
 *  - `meta` object with the `version` and `user` properties.
 *  - `data` data object (the one that gets encoded)
 *  - `signature` used for verification of the URL hash, computed from the `meta` and `data` objects
 */
export class CodeHashManager {
    static readonly SECTION_SEPARATOR = '.';
    static readonly VERSION = 1;

    constructor(private readonly secret: string) {}

    /**
     * Encodes object (e.g. input for actor) to a string hash and uses the `secret` to sign the hash.
     */
    encode<T extends object>(data: T, user: string) {
        const meta = {
            [CodeHashMetaKey.USER]: user,
            [CodeHashMetaKey.VERSION]: CodeHashManager.VERSION,
        };
        const metaBase64 = this.toBase64(JSON.stringify(meta));
        const inputBase64 = this.toBase64(JSON.stringify(data));
        const dataToSign = [metaBase64, inputBase64].join(CodeHashManager.SECTION_SEPARATOR);
        const signature = this.generateSignature(dataToSign);
        const signatureBase64 = this.toBase64(signature);
        const parts = [metaBase64, inputBase64, signatureBase64];

        return parts.join(CodeHashManager.SECTION_SEPARATOR);
    }

    decode(urlHash: string) {
        const parts = urlHash.split(CodeHashManager.SECTION_SEPARATOR);
        const dataToSign = parts.slice(0, 2).join(CodeHashManager.SECTION_SEPARATOR);
        const meta = JSON.parse(this.fromBase64(parts[0]).toString());
        const data = JSON.parse(this.fromBase64(parts[1]).toString());
        const signature = this.fromBase64(parts[2]);
        const expectedSignature = this.generateSignature(dataToSign);
        const validSignature = timingSafeEqual(signature, expectedSignature);

        return {
            data,
            meta: {
                user: meta[CodeHashMetaKey.USER],
                version: meta[CodeHashMetaKey.VERSION],
                validSignature,
            },
        };
    }

    private toBase64(data: string | Buffer) {
        return Buffer.from(data).toString('base64url');
    }

    private fromBase64(encoded: string) {
        return Buffer.from(encoded, 'base64url');
    }

    private generateSignature(data: string) {
        return createHmac('sha256', this.secret).update(data).digest();
    }
}
