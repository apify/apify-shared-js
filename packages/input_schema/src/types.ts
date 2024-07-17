type CommonFieldDefinition<T> = {
    title: string;
    description: string;
    default?: T;
    prefill?: T extends boolean ? never : T;
    example?: T;
    nullable?: boolean;
    sectionCaption?: string;
    sectionDescription?: string;
}

export type StringFieldDefinition = CommonFieldDefinition<string> & { type: 'string' } & {
    // json is specified in tests, but not in docs
    editor: 'textfield' | 'textarea' | 'javascript' | 'python' | 'select' | 'datepicker' | 'hidden' | 'json';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    enum?: string[]; // required if editor is 'select'
    enumTitles?: string[]
    isSecret?: boolean;
}

export type BooleanFieldDefinition = CommonFieldDefinition<boolean> & { type: 'boolean' } & {
    editor?: 'checkbox' | 'hidden';
    groupCaption?: string;
    groupDescription?: string;
}

export type IntegerFieldDefinition = CommonFieldDefinition<number> & { type: 'integer' } & {
    editor?: 'number' | 'hidden';
    maximum?: number;
    minimum?: number;
    unit?: string;
}

export type ObjectFieldDefinition = CommonFieldDefinition<object> & { type: 'object' } & {
    editor: 'json' | 'proxy' | 'hidden';
    patternKey?: string;
    patternValue?: string;
    maxProperties?: number;
    minProperties?: number;
}

export type ArrayFieldDefinition = CommonFieldDefinition<Array<unknown>> & { type: 'array' } & {
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

export type MixedFieldDefinition = CommonFieldDefinition<never> & {
    type: ('string' | 'boolean' | 'integer' | 'object' | 'array')[];
    editor: 'json'
}

export type FieldDefinition = StringFieldDefinition
    | BooleanFieldDefinition
    | IntegerFieldDefinition
    | ObjectFieldDefinition
    | ArrayFieldDefinition
    | MixedFieldDefinition

// should not be present, this type is for invalid schema
type NeverFieldDefinition = CommonFieldDefinition<never> & { type?: undefined, editor?: string }

type FieldDefinitionToUnchecked<T extends FieldDefinition | NeverFieldDefinition> = Pick<T, 'type'> & Partial<T>

// needs to be separated to stay discriminating union
export type FieldDefinitionUnchecked = FieldDefinitionToUnchecked<StringFieldDefinition>
    | FieldDefinitionToUnchecked<BooleanFieldDefinition>
    | FieldDefinitionToUnchecked<IntegerFieldDefinition>
    | FieldDefinitionToUnchecked<ObjectFieldDefinition>
    | FieldDefinitionToUnchecked<ArrayFieldDefinition>
    | FieldDefinitionToUnchecked<MixedFieldDefinition>
    | FieldDefinitionToUnchecked<NeverFieldDefinition>;

/**
 * Unchecked type for input schema that is parsed from JSON.
 */
export type InputSchemaUnchecked = Partial<InputSchemaBaseChecked>

/**
 * Type with checked base, but not properties
 */
export type InputSchemaBaseChecked = InputSchema & {
    properties: Record<string, FieldDefinitionUnchecked>;
}

/**
 * Type with checked base & properties
 */
export type InputSchema = {
    title: string;
    description?: string;
    type: 'object';
    schemaVersion: number;
    properties: Record<string, FieldDefinition>;
    required: string[];

    $schema: unknown;
}
