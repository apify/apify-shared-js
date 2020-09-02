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
        tabs[header] = { language: lang, code: match.groups.code.trim() };
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
