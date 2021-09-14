import { Renderer, lexer, parser } from 'marked';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore no typings for this dependency
import matchAll from 'match-all';
import { customHeadingRenderer } from './markdown_renderers';

/**
 * Map from the language of a fenced code block to the title of corresponding tab.
 * The language is a string provided by the default marked tokenizer.
 * Note that not all of the languages (such as python2) might be possible at the moment
 * in the default marked tokenizer. We anyway include them here for
 * robustness to potential future improvements of marked.
 * In case tab title can't be resolved from language using this mapping, the language itself is used as a tab title.
 */
const LANGUAGE_TO_TAB_TITLE = {
    js: 'Node.JS',
    javascript: 'Node.js',
    nodejs: 'Node.js',
    bash: 'Bash',
    curl: 'cURL',
    dockerfile: 'Dockerfile',
    php: 'PHP',
    json: 'JSON',
    xml: 'XML',
    python: 'Python',
    python2: 'Python 2',
    python3: 'Python 3',
    yml: 'YAML',
    yaml: 'YAML',
};

const APIFY_CODE_TABS = 'apify-code-tabs';
const DEFAULT_MARKED_RENDERER = new Renderer();

const codeTabObjectFromCodeTabMarkdown = (markdown: string): Record<string, { language: string, code: string }> => {
    const matchesIterator = matchAll(markdown, /<marked-tab header="(?<header>.*?)" lang="(?<lang>.*?)">(?<code>.*?)<\/marked-tab>/sg);
    const matches = [];
    let nextMatch = matchesIterator.nextRaw();
    while (nextMatch) {
        matches.push(nextMatch);
        nextMatch = matchesIterator.nextRaw();
    }

    const tabs: Record<string, { language: string, code: string }> = {};

    for (const match of matches) {
        const { header, lang } = match.groups;
        tabs[header] = { language: lang, code: match.groups.code.trim() };
    }

    return tabs;
};

interface MarkedResponse {
    html: string;
    codeTabsObjectPerIndex: Record<number, Record<string, { language: string, code: string }>>;
}

/**
 * This custom function is used in the same context as default `marked` function.
 *
 * It parses the given markdown and treats some headings and code blocks in a custom way
 * -----------------------------------------------------------------------------------------------
 * 0. Heading with [](#custom-id) before the text will have id="custom-id" property on reasulting <h...> tag.
 * E.g.
 * # [](#welcome-title-id) Welcome to Apify
 * is turned to
 * <h1 id="welcome-title-id">Welcome to Apify</h1>
 * -----------------------------------------------------------------------------------------------
 * 1. Fenced code block with explicit language which is in the mapping LANGUAGE_TO_TAB_TITLE
 * ```my-lang
 * my-code
 * ```
 *  This block is turned into [apify-code-tabs]$INDEX[/apify-code-tabs] in returned HTML
 *  and returned codeTabsObjectPerIndex contains key $INDEX with value
 *  {
 *      LANGUAGE_TO_TAB_TITLE[my-lang]: { lang: 'my-lang', code: 'my-code' }
 *  }
 * -----------------------------------------------------------------------------------------------
 * 2. Fenced code block with explicit language which is NOT in the mapping LANGUAGE_TO_TAB_TITLE
 * ```my-lang-not-in-mapping
 * my-code
 * ```
 *  This block is turned into [apify-code-tabs]$INDEX[/apify-code-tabs] in returned HTML
 *  and returned codeTabsObjectPerIndex contains key $INDEX with value
 *  {
 *      my-lang-not-in-mapping: { lang: 'my-lang-not-in-mapping', code: 'my-code' }
 *  }
 * -----------------------------------------------------------------------------------------------
 * 3. Fenced code block with no language
 * ```
 * my-code
 * ```
 *
 * is handled by default marked package and returned in HTML already parsed to <code> block.
 * -----------------------------------------------------------------------------------------------
 * 4. Indented code block
 *      my-code
 *
 * is handled by default marked package and returned in HTML already parsed to <code> block.
 * -----------------------------------------------------------------------------------------------
 * 5. Special marked-tabs code fence
 * Each code block of following form
 * ```marked-tabs
 * <marked-tab header="Node.js" lang="javascript">
 * js-code
 * </marked-tab>
 *
 * <marked-tab header="Python" lang="python">
 * python-code
 * </marked-tab>
 * ```
 * is replaced by [apify-code-tabs]$INDEX[/apify-code-tabs] in the returned HTML where $INDEX is
 * an unique integer, to allow multiple marked-tabs components on the same page.
 *
 * For the example above codeTabsObjectPerIndex would contain key $INDEX with the following value
 * {
 *      'Node.js': {lang: 'javascript', code: 'js-code'},
 *      'Python': {lang: 'python', code: 'python-code'}
 * }
 *
 * i.e. each <marked-tab header="HEADER" lang="LANG">CODE</marked-tab> is turned into
 * HEADER: {lang: LANG, code: CODE} entry.
 *
 * Note that you have to use double quotation marks around HEADER and LANG, otherwise, the expression will not be matched
 * which results in unexpected and hard to debug errors.
 *
 * Each [apify-code-tabs]$INDEX[/apify-code-tabs] is meant to be later replaced be a react component
 * rendering the appropriate codeTabBlockObject returned by this function.
 */
export const apifyMarked = (markdown: string): MarkedResponse => {
    const renderer = new Renderer();
    renderer.heading = customHeadingRenderer;
    renderer.code = function (code, language) {
        if (language) {
            return code;
        }
        return DEFAULT_MARKED_RENDERER.code.call(this, code, language, false);
    };
    const tokens = lexer(markdown);

    let markedTabTokenIndex = 0;
    const codeTabsObjectPerIndex = {};
    tokens.forEach((token) => {
        if (token.type === 'code' && token.lang) {
            if (token.lang === 'marked-tabs') {
                codeTabsObjectPerIndex[markedTabTokenIndex] = codeTabObjectFromCodeTabMarkdown(token.text);
            } else {
                const tabTitle = LANGUAGE_TO_TAB_TITLE[token.lang] || token.lang;
                codeTabsObjectPerIndex[markedTabTokenIndex] = {
                    [tabTitle]: {
                        language: token.lang,
                        code: token.text,
                    },
                };
            }
            token.text = `[${APIFY_CODE_TABS}]${markedTabTokenIndex}[/${APIFY_CODE_TABS}]`;
            markedTabTokenIndex++;
        }
    });

    const html = parser(tokens, { renderer });

    return { html, codeTabsObjectPerIndex };
};
