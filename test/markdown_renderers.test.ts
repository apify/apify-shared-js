import { customHeadingRenderer, customLinkRenderer, customImageRenderer, parseRepoName } from '@apify/markdown';
import { marked, Renderer } from 'marked';

describe('apifyMarked custom renderers work', () => {
    const renderer = new Renderer();
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
    });

    it('replaces relative URLs in images from GitHub repos with absolute URLs pointing to raw files', () => {
        const href = './src/foo/bar.jpeg';
        const text = 'link to image';
        const repoUrl = `https://gitlab.com/${repoFullName}`;
        const renderedLink = customImageRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual(`<img src="https://gitlab.com/apify/actor-test-url/-/raw/main/src/foo/bar.jpeg" alt="link to image" loading="lazy" />`);
    });

    it('does not replace absolute URLs', () => {
        const href = 'https://github.com/apify/actor-test-url/do-not-change';
        const text = 'absolute-link';
        const repoUrl = `https://github.com/${repoFullName}`;
        const renderedLink = customLinkRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual('<a href="https://github.com/apify/actor-test-url/do-not-change" target="_blank" rel="nofollow noreferrer noopener">absolute-link</a>');
    });

    it('customLinkRenderer works with SSH URLs', () => {
        const href = 'https://gitlab.com/apify/actor-test-url';
        const text = 'SSH link';
        const repoUrl = `git@gitlab.com:${repoFullName}.git`;
        const renderedLink = customLinkRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual('<a href="https://gitlab.com/apify/actor-test-url" target="_blank" rel="nofollow noreferrer noopener">SSH link</a>');
    });

    it('customImageRenderer works with SSH URLs', () => {
        const href = 'https://gitlab.com/apify/actor-test-url/badges/master/pipeline.svg';
        const text = 'SSH link';
        const repoUrl = `git@gitlab.com:${repoFullName}.git`;
        const renderedLink = customImageRenderer(href, text, repoUrl, branchName);

        expect(renderedLink).toEqual('<img src="https://gitlab.com/apify/actor-test-url/badges/master/pipeline.svg" alt="SSH link" loading="lazy" />');
    });

    describe('repo name parser works', () => {
        test('works as expected with GitHub URLs', () => {
            const githubUrl = 'https://github.com/apify/apify-docs';
            const expectedRepoName = 'apify/apify-docs';
            expect(parseRepoName(githubUrl)).toEqual(expectedRepoName);
        });

        test('works as expected with GitLab URLs', () => {
            const gitlabUrl = 'https://gitlab.com/apify-public/wiki/-/wikis/public-actors/input';
            const expectedRepoName = 'apify-public/wiki';
            expect(parseRepoName(gitlabUrl)).toEqual(expectedRepoName);
        });

        test('works as expected with BitBucket URLs', () => {
            const bitbucketUrl = 'https://bitbucket.org/apifyteam/apify-system/src/master/';
            const expectedRepoName = 'apifyteam/apify-system';
            expect(parseRepoName(bitbucketUrl)).toEqual(expectedRepoName);
        });

        test('works as expected with URLs containing directories', () => {
            const urlWithDirectory = 'https://github.com/apify/apify-docs.git#my-branch:some/directory';
            const expectedRepoName = 'apify/apify-docs';
            expect(parseRepoName(urlWithDirectory)).toEqual(expectedRepoName);
        });

        test('works as expected with SSH URLs', () => {
            const urlWithDirectory = 'git@github.com:zscrape/craigslist-scraper.git';
            const expectedRepoName = 'zscrape/craigslist-scraper';
            expect(parseRepoName(urlWithDirectory)).toEqual(expectedRepoName);
        });
    });
});
