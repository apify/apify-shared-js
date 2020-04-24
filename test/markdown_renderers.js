// import marked from 'marked';
import { expect } from 'chai';
import { customHeadingRenderer } from '../src/markdown_renderers';

const marked = require('marked');

describe('customHeadingRenderer', () => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;
    marked.use({ renderer });

    // TODO: it ('trims whitespace at the ends and inserts dashes in spaces)

    it('returns a header with ID param when ID is passed', () => {
        const renderedTitle = function () {
            return marked('# Welcome to Apify {#welcome-title-id}');
        };
        expect(renderedTitle()).to.equal(`
            <h1>
                <a 
                    name="welcome-to-apify"
                    href="#welcome-title-id"
                    id="#welcome-title-id">
                    <span class="header-link"></span>
                </a>
                Welcome to Apify
            </h1>`);
    });

    it('adds a hashtag to ID if one isn\'t added', () => {
        const renderedTitle = function () {
            return marked('# Welcome to Apify {welcome-title-id}');
        };
        expect(renderedTitle()).to.equal(`
            <h1>
                <a 
                    name="welcome-to-apify"
                    href="#welcome-title-id"
                    id="#welcome-title-id">
                    <span class="header-link"></span>
                </a>
                Welcome to Apify
            </h1>`);
    });

    it('returns a header without ID param when no ID is passed', () => {
        const renderedTitle = marked('# Welcome to Apify');
        expect(renderedTitle).to.eql(`
            <h1>
                <a 
                    name="welcome-to-apify"
                    href="#welcome-to-apify">
                    <span class="header-link"></span>
                </a>
                Welcome to Apify
            </h1>`);
    });

    it('trims whitespace, inserts dashes between words, converts to lowercase, removes punctuation', () => {
        const renderedTitle = marked('# Welcome to Apify { #  .Welcome -title-id }');
        expect(renderedTitle).to.eql(`
            <h1>
                <a 
                    name="welcome-to-apify"
                    href="#welcome-title-id"
                    id="#welcome-title-id">
                    <span class="header-link"></span>
                </a>
                Welcome to Apify
            </h1>`);
    });
});
