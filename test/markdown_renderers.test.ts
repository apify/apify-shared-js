import marked from 'marked';
import { customHeadingRenderer, customLinkRenderer, customImageRenderer } from '@apify/markdown';

describe('apifyMarked custom renderers work', () => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;

    const branchName = 'main';
    const repoFullName = 'apify/actor-test-url';

    it('uses the custom ID if provided', () => {
        const renderedTitle = marked('# [](#welcome-title-id) Welcome to Apify', { renderer });
        expect(renderedTitle).toEqual(`
            <h1 id="welcome-title-id"><a href="#welcome-title-id"></a>Welcome to Apify</h1>`);
    });

    it('generates ID from text if no ID provided', () => {
        const renderedTitle = marked('## Welcome to Apify', { renderer });
        expect(renderedTitle).toEqual(`
            <h2 id="welcome-to-apify"><a href="#welcome-to-apify"></a>Welcome to Apify</h2>`);
    });

    it('converts to lowercase, removes punctuation, multiple continuous dashes and leading and trailing dash', () => {
        const renderedTitle = marked('### [](#?--welCOme-title-.?id---) Welcome to Apify', { renderer });
        expect(renderedTitle).toEqual(`
            <h3 id="welcome-title-id"><a href="#welcome-title-id"></a>Welcome to Apify</h3>`);
    });

    it('replaces relative URLs from GitHub repos with absolute URLs in links', () => {
        const href = './src/foo/bar';
        const text = 'link to bar';
        const repoUrl = `https://github.com/${repoFullName}`;
        const renderedLink = customLinkRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual('<a href="https://github.com/apify/actor-test-url/tree/main/src/foo/bar" target="_blank" rel="nofollow noreferrer noopener">link to bar</a>');
    })

    it('replaces relative URLs in images from GitHub repos with absolute URLs pointing to raw files', () => {
        const href = './src/foo/bar.jpeg';
        const text = 'link to bar.jpeg';
        const repoUrl = `https://gitlab.com/${repoFullName}`;
        const renderedLink = customImageRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual(`<img src="https://gitlab.com/apify/actor-test-url/-/raw/main/src/foo/bar.jpeg" alt=link to bar.jpeg />`);
    })

    it('does not replace absolute URLs', () => {
        const href = 'https://github.com/apify/actor-test-url/do-not-change';
        const text = 'absolute-link';
        const repoUrl = `https://github.com/${repoFullName}`;
        const renderedLink = customLinkRenderer(href, text, repoUrl, branchName);

<<<<<<< HEAD:test/markdown_renderers.js
        expect(renderedLink).to.equal('<a href="https://github.com/apify/actor-test-url/do-not-change" target="_blank" rel="nofollow noreferrer noopener">absolute-link</a>');
=======
        expect(renderedLink).toEqual('<a href="https://github.com/apify/actor-test-url/do-not-change" rel="nofollow noreferrer noopener">absolute-link</a>');
>>>>>>> 957e3e6 (refactor: split into multiple packages + TS rewrite):test/markdown_renderers.test.ts
    })
});
