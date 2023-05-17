import { encodeInput, decodeInput, separateImports } from '@apify/utilities';

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

test('encode/decode', async () => {
    const hash = encodeInput(input);
    const decoded = decodeInput(hash);

    expect(input).toEqual(decoded);
});

test('import extraction', async () => {
    const { code, imports } = separateImports(input.code);
    const codeLines = code.split('\n');
    const importLines = imports.split('\n');

    for (const line of codeLines) {
        expect(line).not.toMatch(/^import/);
    }

    for (const line of importLines) {
        expect(line).toMatch(/^import/);
    }
});
