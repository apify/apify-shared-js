/* eslint-disable */

import marked from 'marked';
import { expect } from 'chai';

import { customHeadingRenderer } from '../src/markdown_renderers';


describe('apifyMarked custom renderer works', () => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;


    it('uses the custom ID if provided', () => {
        const renderedTitle = marked('# Welcome to Apify {welcome-title-id}', { renderer });
        expect(renderedTitle).to.equal(`
            <h1 id="welcome-title-id">Welcome to Apify</h1>`);
    });

    it('generates ID from text if no ID provided', () => {
        const renderedTitle = marked('## Welcome to Apify', { renderer });
        expect(renderedTitle).to.eql(`
            <h2 id="welcome-to-apify">Welcome to Apify</h2>`);
    });

    it('trims whitespace, inserts dashes between words, converts to lowercase, removes punctuation and trailing dash', () => {
        const renderedTitle = marked('# Welcome to Apify { #  .Welcome -title-id . - ? -}', { renderer });
        expect(renderedTitle).to.eql(`
            <h1 id="welcome-title-id">Welcome to Apify</h1>`);
    });
});
