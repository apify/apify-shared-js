/**
 * This client can be used to generate URLs for Apify image proxy server.
 * Usage:
 * const imageProxyClient = new ImageProxyClient({
 *   hmacKey: process.env.CAMO_KEY,
 *   domain: 'apifyusercontent.com',
 * });
 * const imageUrl = await imageProxyClient.generateUrl('http://example.com/example.gif');
 */
export class ImageProxyClient {
    private readonly domain: string;

    private readonly hmacKey: string;

    private readonly protocol: string;

    private hmacCryptoKey?: CryptoKey;

    /**
     * @param options
     * @param options.domain - Domain name of proxy image server
     * @param options.hmacKey - Key for create Hmac hash
     * @param [options.protocol="https"] - By default https is used
     */
    constructor({ domain, hmacKey, protocol = 'https' }: { domain: string; hmacKey: string; protocol?: string }) {
        if (!domain) throw new Error('ImageProxyClient: Parameter domain is required!');
        if (!hmacKey) throw new Error('ImageProxyClient: Parameter hmacKey is required!');

        this.protocol = protocol;
        this.hmacKey = hmacKey;
        this.domain = domain;
    }

    async _createDigest(string: string): Promise<string> {
        this.hmacCryptoKey ??= await globalThis.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(this.hmacKey),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign'],
        );
        const signature = await globalThis.crypto.subtle.sign(
            'HMAC',
            this.hmacCryptoKey,
            new TextEncoder().encode(string),
        );
        return this._toHex(new Uint8Array(signature));
    }

    _createHex(string: string): string {
        return this._toHex(new TextEncoder().encode(string));
    }

    private _toHex(bytes: Uint8Array): string {
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generates image URL in format:
     * `http://example.com/<digest of image url>?url=<url encoded image url>`
     */
    async generateUrlWithParam(url: string): Promise<string> {
        const digest = await this._createDigest(url);
        const escapedUrl = encodeURIComponent(url);
        return `${this.protocol}://${this.domain}/${digest}/?url=${escapedUrl}`;
    }

    /**
     * Generates image URL in format:
     * `http://example.com/<digest of image url>/<hex string of image url>`
     */
    async generateUrl(url: string): Promise<string> {
        const digest = await this._createDigest(url);
        const hexUrl = this._createHex(url);
        return `${this.protocol}://${this.domain}/${digest}/${hexUrl}`;
    }

    /**
     * Finds all images in HTML and updates src attributes with image proxy URL
     */
    async updateImagesInHtml(html: string): Promise<string> {
        const allImgElements = html.match(/<\s*img[^>]*>/gi);
        if (!allImgElements) return html;

        for (const img of allImgElements) {
            const srcMatch = img.match(/src=["|']([^'">]+)['|"]/);
            if (srcMatch && srcMatch[1] && srcMatch[1].toLowerCase().startsWith('http')) {
                const imageUrl = srcMatch[1];
                const updatedImageUrl = await this.generateUrl(imageUrl);
                const updatedImg = img.replace(imageUrl, updatedImageUrl);
                html = html.replace(img, updatedImg);
            }
        }

        return html;
    }

    /**
     * Creates HTML of image element with image proxy URL
     * @param {string} src Used for src attribute
     * @param {string} title Used for title attribute
     * @param {string} alt Used for alt attribute
     * @return {string} Image element
     */
    async createImageHtml(src: string, title: string, alt: string): Promise<string> {
        return `<img src="${await this.generateUrl(src)}" alt="${alt}" title="${title}">`;
    }
}
