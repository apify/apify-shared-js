import { expect } from 'chai';
import ImageProxyClient from '../build/image_proxy_client';

const IMAGE_PROXY_KEY = '2345DFGHCVBNGHJ';
const IMAGE_PROXY_DOMAIN = 'localhost:3000';

const imageProxyClient = new ImageProxyClient({
    hmacKey: IMAGE_PROXY_KEY,
    domain: IMAGE_PROXY_DOMAIN,
});

describe('proxy image client', () => {
    it('generateUrlWithParam() works', () => {
        const testImageUrl = 'http://example.com/image.gif';
        const proxyUrl = imageProxyClient.generateUrlWithParam(testImageUrl);
        expect('https://localhost:3000/14110f5a2b817884066da289ce004803b35cfefc/?url=http%3A%2F%2Fexample.com%2Fimage.gif').to.be.eql(proxyUrl);
    });

    it('generateUrl() works', () => {
        const testImageUrl = 'http://example.com/image.gif';
        const proxyUrl = imageProxyClient.generateUrl(testImageUrl);
        const expectedUrl = 'https://localhost:3000/14110f5a2b817884066da289ce004803b35cfefc/'
            + '687474703a2f2f6578616d706c652e636f6d2f696d6167652e676966';
        expect(expectedUrl).to.be.eql(proxyUrl);
    });
});
