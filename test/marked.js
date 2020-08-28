/* eslint-disable */

import { expect } from 'chai';
import { overrideMarkedWithCustomSettings } from '../src/marked';

describe('apifyMarked custom renderer works', () => {
    const marked = overrideMarkedWithCustomSettings();

    it('uses the custom ID if provided', () => {
        const renderedTitle = marked('# Welcome to Apify {welcome-title-id}');
        expect(renderedTitle).to.equal(`
            <h1 id="welcome-title-id">Welcome to Apify</h1>`);
    });

    it('generates ID from text if no ID provided', () => {
        const renderedTitle = marked('## Welcome to Apify');
        expect(renderedTitle).to.eql(`
            <h2 id="welcome-to-apify">Welcome to Apify</h2>`);
    });

    it('trims whitespace, inserts dashes between words, converts to lowercase, removes punctuation and trailing dash', () => {
        const renderedTitle = marked('# Welcome to Apify { #  .Welcome -title-id . - ? -}');
        expect(renderedTitle).to.eql(`
            <h1 id="welcome-title-id">Welcome to Apify</h1>`);
    });

    it('correctly parses code block with marked-tabs', () => {
        const markdown = `# Welcome to Apify {welcome-title-id}
            \`\`\`marked-tabs
            <marked-tab header="NodeJS" lang="javascript">
            console.log('Some JS code');
            </marked-tab>
            <marked-tab header="Python" lang="python">
            print('Some python code');
            count = 1
            if count >= 1:
                print('Some intended python code');
            print('Some python code on next line');
            </marked-tab>
            <marked-tab header="Curl" lang="bash">
            echo "Some bash code"
            </marked-tab>
            \`\`\`
        `;

        expect(marked(markdown).trim()).to.eql(`<h1 id="welcome-title-id">Welcome to Apify</h1><apify-code-tabs input="{
\\"NodeJS\\": { \\"language\\": \\"javascript\\", \\"code: \\"console.log('Some JS code');\\" },
\\"Python\\": { \\"language\\": \\"python\\", \\"code: \\"print('Some python code');
count = 1
if count >= 1:
    print('Some intended python code');
print('Some python code on next line');\\" },
\\"Curl\\": { \\"language\\": \\"bash\\", \\"code: \\"echo \\"Some bash code\\"\\" }
}" />`);
    });

    it('correctly parses normal code block', () => {
        const markdown = " # Test heading \
        ``` \
            console.log(\'Hello World\'); \
        ```"
        expect(marked(markdown)).to.eql(`
            <h1 id="test-heading-console-log-hello-world">Test heading         <code>            console.log(&#39;Hello World&#39;);        </code></h1>`);
    });
});
