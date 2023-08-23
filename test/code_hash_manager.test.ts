import { CodeHashManager } from '@apify/utilities';

const secret = 'abcd';
const input = {
    code: `import { PlaywrightCrawler, Dataset } from 'crawlee';

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
// Use the requestHandler to process each of the crawled pages.
async requestHandler({ request, page, enqueueLinks, log }) {
    const title = await page.title();
    log.info(\`Title of \${request.loadedUrl} is '\${title}'\`);

    // Save results as JSON to ./storage/datasets/default
    await Dataset.pushData({ title, url: request.loadedUrl });

    // Extract links from the current page
    // and add them to the crawling queue.
    await enqueueLinks();
},
// Uncomment this option to see the browser window.
// headless: false,
});

// Add first URL to the queue and start the crawl.
await crawler.run(['https://crawlee.dev']);`,
};

const manager = new CodeHashManager(secret);

test('encode/decode', async () => {
    const hash = manager.encode(input, '123');
    const { data, meta } = manager.decode(hash);

    expect(typeof hash).toBe('string');
    expect(hash.split(CodeHashManager.SECTION_SEPARATOR)).toHaveLength(3);
    expect(input).toEqual(data);
    expect(meta).toEqual({
        version: 1,
        userId: '123',
        isSignatureValid: true,
    });
});

test('encode without secret', async () => {
    const manager2 = new CodeHashManager('');
    const hash = manager2.encode(input, '123');
    const { data, meta } = manager.decode(hash);

    expect(typeof hash).toBe('string');
    expect(hash.split(CodeHashManager.SECTION_SEPARATOR)).toHaveLength(3);
    expect(input).toEqual(data);
    expect(meta).toEqual({
        version: 1,
        userId: '123',
        isSignatureValid: false,
    });
});
