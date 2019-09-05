import crypto from 'crypto';
import querystring from 'querystring';

/**
 * This client can be used to generate URLs for Apify image proxy server.
 * Usage:
 * const imageProxyClient = new ImageProxyClient({
 *   key: process.env.CAMO_KEY,
 *   domain: 'apifyusercontent.com',
 * });
 * const imageUrl = imageProxyClient.generateUrl('http://example.com/example.gif');
 */
export default class ImageProxyClient {
    /**
     * @param domain - Domain name of proxy image server
     * @param key - Key for create Hmac hash
     * @param [protocol] - By default https is used
     */
    constructor({ domain, key, protocol = 'https' }) {
        this.protocol = protocol;
        this.key = key;
        this.domain = domain;
    }

    _createDigest(string) {
        const hmac = crypto.createHmac('sha1', this.key).update(string);
        return hmac.digest('hex');
    }

    // eslint-disable-next-line class-methods-use-this
    _createHex(string) {
        return new Buffer(string, 'utf8').toString('hex');
    }

    /**
     * Generates image URL in format:
     * http://example.com/<digest of image url>?url=<url encoded image url>
     * @param url
     * @return {string}
     */
    generateUrlWithParam(url) {
        const digest = this._createDigest(url);
        const escapedUrl = querystring.escape(url);
        return `${this.protocol}://${this.domain}/${digest}/?url=${escapedUrl}`;
    }

    /**
     * Generates image URL in format:
     * http://example.com/<digest of image url>/<hex string of image url>
     * @param url
     * @return {string}
     */
    generateUrl(url) {
        const digest = this._createDigest(url);
        const hexUrl = this._createHex(url);
        return `${this.protocol}://${this.domain}/${digest}/${hexUrl}`;
    }
}
