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
    editor: 'textfield' | 'textarea' | 'javascript' | 'python' | 'select' | 'datepicker' | 'hidden' | 'json' | 'dataset' | 'keyValueStore' | 'requestQueue';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    enum?: readonly string[]; // required if editor is 'select'
    enumTitles?: readonly string[]
    isSecret?: boolean;
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

export type ObjectFieldDefinition = CommonFieldDefinition<object> & {
    type: 'object'
    editor: 'json' | 'proxy' | 'hidden';
    patternKey?: string;
    patternValue?: string;
    maxProperties?: number;
    minProperties?: number;
}

export type ArrayFieldDefinition = CommonFieldDefinition<Array<unknown>> & {
    type: 'array'
    editor: 'json' | 'requestListSources' | 'pseudoUrls' | 'globs' | 'keyValue' | 'stringList' | 'select' | 'hidden';
    placeholderKey?: string;
    placeholderValue?: string;
    patternKey?: string;
    patternValue?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    items?: unknown;
}

type AllTypes = StringFieldDefinition['type']
    | BooleanFieldDefinition['type']
    | IntegerFieldDefinition['type']
    | ObjectFieldDefinition['type']
    | ArrayFieldDefinition['type']

export type MixedFieldDefinition = CommonFieldDefinition<never> & {
    type: readonly AllTypes[];
    editor: 'json'
}

export type FieldDefinition = StringFieldDefinition
    | BooleanFieldDefinition
    | IntegerFieldDefinition
    | ObjectFieldDefinition
    | ArrayFieldDefinition
    | MixedFieldDefinition

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
