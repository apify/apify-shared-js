import vm from 'node:vm';

import type { CheerioAPI, Node } from 'cheerio';

import type { AbstractRule, JsonObject, ObjectPropertyInfo } from '../types';
import { getJsonValue } from '../utils';

export const RULE_NAME = 'ReplaceValue' as const;

export interface ReplaceValueRule extends AbstractRule<typeof RULE_NAME> {
    type: 'json' | 'js';
    content: string;
}

function replaceByJsonValue(objectPropertyInfo: ObjectPropertyInfo, rule: Omit<ReplaceValueRule, 'applyRule'>, json: JsonObject) {
    const valueHolder = getJsonValue(json, objectPropertyInfo.jsonPointer);
    valueHolder.value = JSON.parse(rule.content);
}

function replaceByJsValue(objectPropertyInfo: ObjectPropertyInfo, rule: Omit<ReplaceValueRule, 'applyRule'>, json: JsonObject) {
    const valueHolder = getJsonValue(json, objectPropertyInfo.jsonPointer);
    // This should be safe as these XML rules are always bundled with the code in the repository.
    valueHolder.value = vm.runInNewContext(rule.content, {
        value: valueHolder.value,
    }, {
        timeout: 2000,
    });
}

export function parseReplaceValueRule($: CheerioAPI, ruleElement: Node): ReplaceValueRule | null {
    const type = $(ruleElement).attr('type');

    if (type === 'json') {
        const rule = {
            ruleName: RULE_NAME,
            jsonPath: $(ruleElement).attr('json-path')!,
            type,
            content: $(ruleElement).text()!,
        } as const;
        return {
            ...rule,
            applyRule: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => replaceByJsonValue(objectPropertyInfo, rule, json),
        } satisfies ReplaceValueRule;
    } if (type === 'js') {
        const rule = {
            ruleName: RULE_NAME,
            jsonPath: $(ruleElement).attr('json-path')!,
            type,
            content: $(ruleElement).text()!,
        } as const;
        return {
            ...rule,
            applyRule: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => replaceByJsValue(objectPropertyInfo, rule, json),
        } satisfies ReplaceValueRule;
    }
    // eslint-disable-next-line no-console
    console.warn(`Unknown format "${type}", skipping...`);

    return null;
}
