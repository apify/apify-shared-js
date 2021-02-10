/* eslint-disable */

import marked from 'marked';
import { expect } from 'chai';

import { customHeadingRenderer } from '../src/markdown_renderers';


describe('apifyMarked custom renderer works', () => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;


    it('uses the custom ID if provided', () => {
        const renderedTitle = marked('# [](#welcome-title-id) Welcome to Apify', { renderer });
        expect(renderedTitle).to.equal(`
            <h1 id="welcome-title-id"><a href="#welcome-title-id"></a>Welcome to Apify</h1>`);
    });

    it('generates ID from text if no ID provided', () => {
        const renderedTitle = marked('## Welcome to Apify', { renderer });
        expect(renderedTitle).to.eql(`
            <h2 id="welcome-to-apify"><a href="#welcome-to-apify"></a>Welcome to Apify</h2>`);
    });

    it('converts to lowercase, removes punctuation, multiple continuous dashes and leading and trailing dash', () => {
        const renderedTitle = marked('### [](#?--welCOme-title-.?id---) Welcome to Apify', { renderer });
        expect(renderedTitle).to.equal(`
            <h3 id="welcome-title-id"><a href="#welcome-title-id"></a>Welcome to Apify</h3>`);
    });
});
