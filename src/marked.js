import marked from 'marked';
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
const LANGAUGE_TO_TAB_TITLE = {
    js: 'Node.JS',
    javascript: 'Node.JS',
    nodejs: 'Node.JS',
    bash: 'Bash',
    curl: 'cURL',
    dockerfile: 'Dockerfile',
    php: 'PHP',
    json: 'JSON',
    xml: 'XML',
    python: 'Python',
    python2: 'Python3',
    python3: 'Python3',
    yml: 'YAML',
    yaml: 'YAML',
};

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
        if (language) {
            return code;
        }
        return DEFAULT_MARKED_RENDERER.code(code, language);
    };
    const tokens = marked.lexer(markdown);

    /**
     * Each code block of following form
     * ```marked-tabs
     * ... some code
     * ```
     * is replaced by [apify-code-tabs]INDEX[/apify-code-tabs] where index is
     * an increasing integer starting at 0, to allow multiple marked-tabs components
     * on the same page.
     *
     * [apify-code-tabs]INDEX[/apify-code-tabs] is meant to be later replaced be a react component
     * rendering the appropriate codeTabBlockObject returned by this function.
     */
    let markedTabTokenIndex = 0;
    const codeTabsObjectPerIndex = {};
    tokens.forEach((token) => {
        if (token.type === 'code' && token.lang) {
            if (token.lang === 'marked-tabs') {
                codeTabsObjectPerIndex[markedTabTokenIndex] = codeTabObjectFromCodeTabMarkdown(token.text);
            } else {
                const tabTitle = LANGAUGE_TO_TAB_TITLE[token.lang] || token.lang;
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

    const html = marked.parser(tokens, { renderer });

    return { html, codeTabsObjectPerIndex };
};
