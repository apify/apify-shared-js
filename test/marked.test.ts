/* eslint-disable */

import { apifyMarked } from '@apify/markdown';

// This is here in order not to mess up indentation
const MARKDOWN_UNDER_TEST = `
# Title

## Code block with tabs
\`\`\`marked-tabs
<marked-tab header="Node.js" lang="javascript">
console.log('Some JS code');
</marked-tab>

<marked-tab header="Python" lang="python">
print('Some python code');
count = 1
if count >= 1:
    print('Some intended python code');
print('Some python code on next line');
</marked-tab>

<marked-tab header="Bash" lang="bash">
echo "Some bash code"
</marked-tab>
\`\`\`

## Code block without tabs
\`\`\`javascript
console.log('Your standard javascript code block')
\`\`\`

\`\`\`
console.log('Fenced block with no language')
\`\`\`

    console.log('Tab indented block')

## Second block with tabs
\`\`\`marked-tabs
<marked-tab header="Custom title" lang="javascript">
console.log('Some JS code 2');
</marked-tab>
<marked-tab header="Bash" lang="bash">
echo "Some bash code 2"
</marked-tab>
\`\`\`

## Footer
This is footer text.
`;

const EXPECTED_HTML =   '\n' +
'            <h1 id="title"><a href="#title"></a>Title</h1>\n' +
'            <h2 id="code-block-with-tabs"><a href="#code-block-with-tabs"></a>Code block with tabs</h2>[apify-code-tabs]0[/apify-code-tabs]\n' +
'            <h2 id="code-block-without-tabs"><a href="#code-block-without-tabs"></a>Code block without tabs</h2>[apify-code-tabs]1[/apify-code-tabs]<pre><code>console.log(&#39;Fenced block with no language&#39;)\n' +
'</code></pre>\n' +
'<pre><code>console.log(&#39;Tab indented block&#39;)\n' +
'</code></pre>\n' +
'\n' +
'            <h2 id="second-block-with-tabs"><a href="#second-block-with-tabs"></a>Second block with tabs</h2>[apify-code-tabs]2[/apify-code-tabs]\n' +
'            <h2 id="footer"><a href="#footer"></a>Footer</h2><p>This is footer text.</p>\n';

describe('apifyMarked custom renderer works', () => {

    it('correctly parses markdown containing both ordinary code block and code blocks with tabs', () => {
        const {html, codeTabsObjectPerIndex} = apifyMarked(MARKDOWN_UNDER_TEST);
        expect(html).toEqual(EXPECTED_HTML);
        expect(codeTabsObjectPerIndex).toEqual(
            {
                '0': {
                    'Node.js': { language: 'javascript', code: "console.log('Some JS code');" },
                    Python: {
                        language: 'python',
                        code: "print('Some python code');\n" +
                        'count = 1\n' +
                        'if count >= 1:\n' +
                        "    print('Some intended python code');\n" +
                        "print('Some python code on next line');"
                    },
                    'Bash': { language: 'bash', code: 'echo "Some bash code"' }
                },
                '1': {
                    'Node.js': { language: 'javascript', code: "console.log('Your standard javascript code block')" },
                },
                '2': {
                    'Custom title': { language: 'javascript', code: "console.log('Some JS code 2');" },
                    Bash: { language: 'bash', code: 'echo "Some bash code 2"' }
                }
            }
        );
    });
});
