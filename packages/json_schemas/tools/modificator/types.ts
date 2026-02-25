import type { AddDescriptionRule } from './rules/add-description-rule';
import type { RemoveValueRule } from './rules/remove-value-rule';
import type { ReplaceValueRule } from './rules/replace-value-rule';

type Primitive = string | number | boolean | null | undefined;

interface Arr extends Array<JsonValue> {}

export type JsonValue = Primitive | JsonObject | Arr;

export interface JsonObject {
    [member: string]: JsonValue;
}

export interface ObjectPropertyInfo<VALUE = JsonValue> {
    key?: string,
    value: VALUE;
    jsonPointer: string;
    parent?: ObjectPropertyInfo<JsonObject>;
}

export interface AbstractRule<RULE_NAME extends string> {
    ruleName: RULE_NAME;
    applyRule: (objectPropertyInfo: ObjectPropertyInfo, json: JsonObject) => void
    jsonPath: string;
}

// RULES
export type Rule = AddDescriptionRule | ReplaceValueRule | RemoveValueRule;
