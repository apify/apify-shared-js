import { expect } from 'chai';
import ImageProxyClient from '../build/image_proxy_client';

const IMAGE_PROXY_KEY = '2345DFGHCVBNGHJ';
const IMAGE_PROXY_DOMAIN = 'localhost:3000';

const imageProxyClient = new ImageProxyClient({
    hmacKey: IMAGE_PROXY_KEY,
    domain: IMAGE_PROXY_DOMAIN,
});

const TEST_IMAGE_URL = 'http://example.com/image.gif';
const TEST_IMAGE_URL_2 = 'HTTP://example.com/image.gif';
const EXPECTED_IMAGE_URL = 'https://localhost:3000/14110f5a2b817884066da289ce004803b35cfefc/'
    + '687474703a2f2f6578616d706c652e636f6d2f696d6167652e676966';
const EXPECTED_IMAGE_URL_2 = 'https://localhost:3000/3bb9136ff6f149fce6770d65291f29554b372e11/'
    + '485454503a2f2f6578616d706c652e636f6d2f696d6167652e676966';

const getComplicatedHtml = (imageUrl) => {
    return `<img src="${imageUrl}" alt="test image" title="test image"><br>`
        + `<img src="${imageUrl}" alt="test image" title="test image">`
        + `<IMG src="${imageUrl}" alt="test image" title="test image">`
        + `<IMG alt="test image" title="test image" src="${imageUrl}">`
        + `<IMG alt='test image' title="test image" src='${imageUrl}'>`
        + `<img src='${imageUrl}' alt='test image' title='test image'/>`
        + '<img src="/relative/img.jpg" alt="test image" title="test image">';
};

describe('proxy image client', () => {
    it('generateUrlWithParam() works', () => {
        const testImageUrl = 'http://example.com/image.gif';
        const proxyUrl = imageProxyClient.generateUrlWithParam(testImageUrl);
        expect('https://localhost:3000/14110f5a2b817884066da289ce004803b35cfefc/?url=http%3A%2F%2Fexample.com%2Fimage.gif').to.be.eql(proxyUrl);
    });

    it('generateUrl() works', () => {
        const proxyUrl = imageProxyClient.generateUrl(TEST_IMAGE_URL);
        expect(EXPECTED_IMAGE_URL).to.be.eql(proxyUrl);
    });

    it('updateImagesInHtml() works', () => {
        const html = (imageUrl) => {
            return '<div class="test-class">'
                + `<img src="${imageUrl}" alt="test image" title="test image">`
                + '<!-- toc -->'
                + '</div>';
        };
        const testHtml = html(TEST_IMAGE_URL);
        const updatedHtml = imageProxyClient.updateImagesInHtml(testHtml);
        expect(updatedHtml).to.be.eql(html(EXPECTED_IMAGE_URL));
    });

    it('updateImagesInHtml() works with just image in HTML', () => {
        const testHtml = getComplicatedHtml(TEST_IMAGE_URL);
        const updatedHtml = imageProxyClient.updateImagesInHtml(testHtml);
        expect(updatedHtml).to.be.eql(getComplicatedHtml(EXPECTED_IMAGE_URL));
    });

    it('updateImagesInHtml() works with URL with upper case protocol', () => {
        const testHtml = getComplicatedHtml(TEST_IMAGE_URL_2);
        const updatedHtml = imageProxyClient.updateImagesInHtml(testHtml);
        expect(updatedHtml).to.be.eql(getComplicatedHtml(EXPECTED_IMAGE_URL_2));
    });

    it('updateImagesInHtml() does not break HTML comment', () => {
        const html = '<!-- toc -->';
        const updatedHtml = imageProxyClient.updateImagesInHtml(html);
        expect(updatedHtml).to.be.eql(html);
    });

    it('createImageHtml() works', () => {
        const testTitle = 'test title';
        const testAlt = 'test alt';
        const imageHtml = imageProxyClient.createImageHtml(TEST_IMAGE_URL, testTitle, testAlt);
        expect(imageHtml).to.be.eql(`<img src="${EXPECTED_IMAGE_URL}" alt="${testAlt}" title="${testTitle}">`);
    });
});
