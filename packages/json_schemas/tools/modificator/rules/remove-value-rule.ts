import type { CheerioAPI, Node } from 'cheerio';

import type { AbstractRule, JsonObject, ObjectPropertyInfo } from '../types';
import { parseJsonPointer } from '../utils';

export const RULE_NAME = 'RemoveValue' as const;

export interface RemoveValueRule extends AbstractRule<typeof RULE_NAME> {}

function removeValue(objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) {
    // Navigate to parent and delete the property
    const { jsonPointer } = objectPropertyInfo;
    if (jsonPointer === '/') {
        throw new Error('Cannot remove the root object');
    }

    const parts = parseJsonPointer(jsonPointer);

    let current: any = json;
    for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
    }

    // Check if parent is an array - deleting from arrays leaves holes
    if (Array.isArray(current)) {
        throw new Error(`Cannot remove array elements: ${objectPropertyInfo.jsonPointer}`);
    }

    const lastPart = parts.length - 1;
    delete current[parts[lastPart]];
}

export function parseRemoveValueRule($: CheerioAPI, ruleElement: Node): RemoveValueRule | null {
    return {
        ruleName: RULE_NAME,
        jsonPath: $(ruleElement).attr('json-path')!,
        applyRule: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => removeValue(objectPropertyInfo, json),
    } satisfies RemoveValueRule;
}
