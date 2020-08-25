/* eslint-disable */

import marked from 'marked';
import { expect } from 'chai';
import { apifyMarked } from '../src/marked';

describe('apifyMarked', () => {
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

        expect(apifyMarked(markdown).trim()).to.eql(`<h1 id="welcome-title-id">Welcome to Apify</h1><apify-code-tabs input="{
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
        expect(apifyMarked(markdown)).to.eql(marked(markdown));
    });
});
