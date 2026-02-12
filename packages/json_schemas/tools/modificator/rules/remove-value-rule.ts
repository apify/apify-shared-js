import type { CheerioAPI, Node } from 'cheerio';

import type { AbstractRule, JsonObject, ObjectPropertyInfo } from '../types';
import { getJsonValue } from '../utils';

export const RULE_NAME = 'RemoveValue' as const;

export interface RemoveValueRule extends AbstractRule<typeof RULE_NAME> {}

function removeValue(objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) {
    const s = getJsonValue(json, objectPropertyInfo.jsonPointer);

    s.value = undefined;
}

export function parseRemoveValueRule($: CheerioAPI, ruleElement: Node): RemoveValueRule | null {
    return {
        __type: RULE_NAME,
        jsonPath: $(ruleElement).attr('json-path')!,
        __apply: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => removeValue(objectPropertyInfo, json),
    } satisfies RemoveValueRule;
}
