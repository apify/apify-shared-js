import { customHeadingRenderer } from './markdown_renderers';

const marked = require('marked');

export const apifyMarked = (() => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;
    renderer.code = (code) => {
        if (!code.trim().startsWith('```marked-tabs')) {
            return false;
        }

        const matches = [...code.matchAll(/<marked-tab header="(?<header>.*?)" lang="(?<lang>.*?)">(?<code>.*?)<\/marked-tab>/sg)];

        const inputArg = matches
            .map((match) => {
                const { header, lang } = match.groups;
                let tabCode = match.groups.code;

                let numLeadingSpacesOnFirstLine = 0;
                while (tabCode.startsWith('\n') || tabCode.startsWith(' ')) {
                    if (tabCode.startsWith('\n')) {
                        numLeadingSpacesOnFirstLine = 0;
                    } else if (tabCode.startsWith(' ')) {
                        numLeadingSpacesOnFirstLine += 1;
                    }
                    tabCode = tabCode.substring(1);
                }

                while (tabCode.endsWith('\n') || tabCode.endsWith(' ')) {
                    tabCode = tabCode.substring(0, tabCode.length - 1);
                }

                tabCode = tabCode
                    .split('\n')
                    .map((line, index) => {
                        if (index === 0) {
                            return line;
                        }

                        for (let i = 0; i < numLeadingSpacesOnFirstLine; i++) {
                            if (line.startsWith(' ')) {
                                line = line.substring(1);
                            }
                        }
                        return line;
                    })
                    .join('\n');

                return `"${header}": { "language": "${lang}", "code: "${tabCode}" }`;
            })
            .join(',\n');
        return `<apify-code-tabs input="{\n${inputArg.replace(/"/g, '\\"')}\n}" />`;
    };
    marked.use({ renderer });

    return marked;
})();
