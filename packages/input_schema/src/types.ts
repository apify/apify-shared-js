type CommonFieldDefinition<T> = {
    title: string;
    description: string;
    default?: T;
    prefill?: T;
    example?: T;
    nullable?: boolean;
    sectionCaption?: string;
    sectionDescription?: string;
}

export type StringFieldDefinition = CommonFieldDefinition<string> & {
    type: 'string'
    editor: 'textfield' | 'textarea' | 'javascript' | 'python' | 'select' | 'datepicker' | 'hidden' | 'json' | 'fileupload';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    enum?: readonly string[]; // required if editor is 'select'
    enumTitles?: readonly string[];
    enumSuggestedValues?: readonly string[];
    isSecret?: boolean;
    // Used for 'datepicker' editor, absolute is considered as default value
    dateType?: 'absolute' | 'relative' | 'absoluteOrRelative';
}

export type BooleanFieldDefinition = CommonFieldDefinition<boolean> & {
    type: 'boolean'
    editor?: 'checkbox' | 'hidden';
    groupCaption?: string;
    groupDescription?: string;
}

export type IntegerFieldDefinition = CommonFieldDefinition<number> & {
    type: 'integer'
    editor?: 'number' | 'hidden';
    maximum?: number;
    minimum?: number;
    unit?: string;
}

export type NumberFieldDefinition = CommonFieldDefinition<number> & {
    type: 'number'
    editor?: 'number' | 'hidden';
    maximum?: number;
    minimum?: number;
    unit?: string;
}

export type ObjectFieldDefinition = CommonFieldDefinition<object> & {
    type: 'object'
    editor: 'json' | 'proxy' | 'schemaBased' | 'hidden';
    patternKey?: string;
    patternValue?: string;
    maxProperties?: number;
    minProperties?: number;
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
}

export type ArrayFieldDefinition = CommonFieldDefinition<unknown[]> & {
    type: 'array'
    editor: 'json' | 'requestListSources' | 'pseudoUrls' | 'globs' | 'keyValue' | 'stringList' | 'select' | 'schemaBased' | 'hidden';
    placeholderKey?: string;
    placeholderValue?: string;
    patternKey?: string;
    patternValue?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    items?: unknown;
}

export type CommonResourceFieldDefinition<T> = CommonFieldDefinition<T> & {
    editor?: 'resourcePicker' | 'hidden';
    resourceType: 'dataset' | 'keyValueStore' | 'requestQueue';
    resourcePermissions?: ('READ' | 'WRITE')[];
}

export type ResourceFieldDefinition = CommonResourceFieldDefinition<string> & {
    type: 'string';
}

export type ResourceArrayFieldDefinition = CommonResourceFieldDefinition<string[]> & {
    type: 'array';
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
}

type AllTypes = StringFieldDefinition['type']
    | BooleanFieldDefinition['type']
    | IntegerFieldDefinition['type']
    | NumberFieldDefinition['type']
    | ObjectFieldDefinition['type']
    | ArrayFieldDefinition['type']

export type MixedFieldDefinition = CommonFieldDefinition<never> & {
    type: readonly AllTypes[];
    editor: 'json'
}

export type FieldDefinition = StringFieldDefinition
    | BooleanFieldDefinition
    | IntegerFieldDefinition
    | NumberFieldDefinition
    | ObjectFieldDefinition
    | ArrayFieldDefinition
    | MixedFieldDefinition
    | ResourceFieldDefinition
    | ResourceArrayFieldDefinition

/**
 * Type with checked base, but not properties
 */
export type InputSchemaBaseChecked = Omit<InputSchema, 'properties'> & {
    properties: Record<string, Record<string, unknown>>;
}

/**
 * Type with checked base & properties
 */
export type InputSchema = {
    type: 'object';
    title: string;
    description?: string;
    schemaVersion: number;
    properties: Record<string, FieldDefinition>;
    required?: readonly string[];

    $schema?: unknown;
}
