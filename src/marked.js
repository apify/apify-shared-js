import marked from 'marked';
import { customHeadingRenderer } from './markdown_renderers';

const matchAll = require('match-all');


const APIFY_CODE_TABS = 'apify-code-tabs';
const DEFAULT_MARKED_RENDERER = new marked.Renderer();

/**
 * @param {string} markdown
 * @return { Object.<string, {language: string, code: string}> } tabs
 */
const codeTabObjectFromCodeTabMarkdown = (markdown) => {
    const matchesIterator = matchAll(markdown, /<marked-tab header="(?<header>.*?)" lang="(?<lang>.*?)">(?<code>.*?)<\/marked-tab>/sg);
    const matches = [];
    let nextMatch = matchesIterator.nextRaw();
    while (nextMatch) {
        matches.push(nextMatch);
        nextMatch = matchesIterator.nextRaw();
    }

    const tabs = {};
    for (const match of matches) {
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
        tabs[header] = { language: lang, code: tabCode };
    }
    return tabs;
};


/**
 * @param {string} markdown
 * @return {{ html: string, codeTabsObjectPerIndex: Object.<number, Object.<string, {language: string, code: string}>> }}
 */
export const apifyMarked = (markdown) => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;
    renderer.code = (code, language) => {
        if (language === 'marked-tabs') {
            return code;
        }
        return DEFAULT_MARKED_RENDERER.code(code, language);
    };
    const tokens = marked.lexer(markdown);

    let markedTabTokenIndex = 0;
    const codeTabsObjectPerIndex = {};
    tokens.forEach((token) => {
        if (token.type === 'code' && token.lang && token.lang === 'marked-tabs') {
            codeTabsObjectPerIndex[markedTabTokenIndex] = codeTabObjectFromCodeTabMarkdown(token.text);
            token.text = `[${APIFY_CODE_TABS}]${markedTabTokenIndex}[${APIFY_CODE_TABS}]`;

            markedTabTokenIndex++;
        }
    });

    const html = marked.parser(tokens, { renderer });

    return { html, codeTabsObjectPerIndex };
};
