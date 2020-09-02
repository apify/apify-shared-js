/* eslint-disable */

import { expect } from 'chai';

import {apifyMarked} from '../src/marked';

// This is here in order not to mess up indentation
const MARKDOWN_UNDER_TEST = `
# Title

## Code block with tabs
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

## Code block without tabs
\`\`\`javascript
console.log('Your standard javascript code block')
\`\`\`

## Second block with tabs
\`\`\`marked-tabs
<marked-tab header="NodeJS" lang="javascript">
console.log('Some JS code 2');
</marked-tab>
<marked-tab header="Curl" lang="bash">
echo "Some bash code 2"
</marked-tab>
\`\`\`

## Footer
This is footer text.
`;

const EXPECTED_HTML =   '\n' +
'            <h1 id="title">Title</h1>\n' +
'            <h2 id="code-block-with-tabs">Code block with tabs</h2>[apify-code-tabs]0[apify-code-tabs]\n' +
'            <h2 id="code-block-without-tabs">Code block without tabs</h2><pre><code class="language-javascript">console.log(&#39;Your standard javascript code block&#39;)</code></pre>\n' +
'\n' +
'            <h2 id="second-block-with-tabs">Second block with tabs</h2>[apify-code-tabs]1[apify-code-tabs]\n' +
'            <h2 id="footer">Footer</h2><p>This is footer text.</p>\n';

describe('apifyMarked custom renderer works', () => {

    it('correctly parses markdown containing both ordinary code block and code blocks with tabs', () => {
        const {html, codeTabsObjectPerIndex} = apifyMarked(MARKDOWN_UNDER_TEST);
        expect(html).to.eql(EXPECTED_HTML);
        expect(codeTabsObjectPerIndex).to.eql(
            {
                '0': {
                  NodeJS: { language: 'javascript', code: "console.log('Some JS code');" },
                  Python: {
                    language: 'python',
                    code: "print('Some python code');\n" +
                      'count = 1\n' +
                      'if count >= 1:\n' +
                      "    print('Some intended python code');\n" +
                      "print('Some python code on next line');"
                  },
                  Curl: { language: 'bash', code: 'echo "Some bash code"' }
                },
                '1': {
                  NodeJS: { language: 'javascript', code: "console.log('Some JS code 2');" },
                  Curl: { language: 'bash', code: 'echo "Some bash code 2"' }
                }
            }
        );
    });
});
