import type { CheerioAPI, Node } from 'cheerio';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as cheerio from 'cheerio';
// eslint-disable-next-line import/no-extraneous-dependencies
import showdown from 'showdown';

import type { AbstractRule, JsonObject, JsonValue, ObjectPropertyInfo } from '../types';
import { getJsonValue, isPlainJsonObject } from '../utils';

export const RULE_NAME = 'AddDescription' as const;

export interface AddDescriptionRule extends AbstractRule<typeof RULE_NAME> {
    format: 'markdown';
    contentInMarkdown: string;
}

function reindentMarkdown(code: string): string {
    if (!code) {
        return code;
    }

    const lines = code
        .replace(/^\n+/, '')
        .replace(/\n+ *$/, '')
        .replace(/^ *\n+$/, '')
        .split('\n');

    const firstLineSpaces = (lines[0].match(/^(\s*)/)?.[0] ?? '').length;

    const result: string[] = [];

    const reindentSpaces = new RegExp(`^ {0,${firstLineSpaces}}`);

    for (const line of lines) {
        result.push(line.replace(reindentSpaces, ''));
    }

    return result.join('\n');
}

function formatVsCodeDescription(markdownContent: string): string | undefined {
    return markdownContent;
}

function formatIntelliJDescription(markdownContent: string): string | undefined {
    return formatHtmlDescription(markdownContent);
}

function formatHtmlDescription(markdownContent: string): string | undefined {
    const markdownToHtmlConverter = new showdown.Converter({ noHeaderId: true });

    return markdownToHtmlConverter.makeHtml(markdownContent);
}

function formatSimpleDescription(markdownContent: string): string | undefined {
    const htmlDescription = formatHtmlDescription(markdownContent);
    if (!htmlDescription) {
        return undefined;
    }
    const $ = cheerio.load(htmlDescription);

    // TODO maybe we want to evaluate more than just first paragraph?
    const descriptionElement = $('p').first();

    // Add the urls after the links text as hypertext is not supported
    descriptionElement.find('a').each((_, el) => {
        const url = $(el).attr('href');
        if (url) {
            $(el).after(` (${url})`);
        }
    });

    return descriptionElement.text()
        .replace(/\s*\n\s*/g, ' ') // no new lines in plain Descriptions
        .trim() || undefined;
}

function processAddDescriptionRule(objectPropertyInfo: ObjectPropertyInfo, json: JsonObject, rule: Omit<AddDescriptionRule, 'applyRule'>) {
    const objectProperty = getJsonValue<Record<string, JsonValue>>(json, objectPropertyInfo.jsonPointer);

    if (objectProperty.value && isPlainJsonObject(objectProperty.value)) {
        const reindentedContentInMarkdown = reindentMarkdown(rule.contentInMarkdown);

        objectProperty.value.description = formatSimpleDescription(reindentedContentInMarkdown);
        objectProperty.value['x-intellij-html-description'] ??= formatIntelliJDescription(reindentedContentInMarkdown);
        objectProperty.value.markdownDescription ??= formatVsCodeDescription(reindentedContentInMarkdown);
    } else {
        const parentJsonPointer = objectPropertyInfo.parent?.jsonPointer;
        if (parentJsonPointer) {
            // Check for an odd number of trailing "properties" attributes in a parent's jsonPointer path
            // ex. objectPropertyInfo.jsonPointer = /properties/properties/description not being an object is not a problem,
            // but objectPropertyInfo.jsonPointer = /properties/description not being an object deserves a warning
            const hasOddNumberOfTrailingProperties = (parentJsonPointer.match(/(\/properties)(?=(\/properties)*$)/g)?.length ?? 0) % 2 === 1;

            if (hasOddNumberOfTrailingProperties) {
                // eslint-disable-next-line no-console
                console.warn(`Cannot add description to "${objectPropertyInfo.jsonPointer}" (not an object type)!`);
            }
        }
    }
}

export function parseAddDescriptionRule($: CheerioAPI, ruleElement: Node): AddDescriptionRule | null {
    const format = $(ruleElement).attr('format');
    if (format === 'markdown') {
        const rule = {
            ruleName: RULE_NAME,
            applyRule: processAddDescriptionRule,
            jsonPath: $(ruleElement).attr('json-path')!,
            format,
            contentInMarkdown: $(ruleElement).text(),
        } as const;
        return {
            ...rule,
            applyRule: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => processAddDescriptionRule(objectPropertyInfo, json, rule),
        };
    }
    // eslint-disable-next-line no-console
    console.warn(`Unknown format "${format}", skipping...`);

    return null;
}
