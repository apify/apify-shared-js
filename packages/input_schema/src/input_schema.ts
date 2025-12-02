import type { ErrorObject, Schema } from 'ajv';
import type Ajv from 'ajv';

import { inputSchema as schema } from '@apify/json_schemas';

import { m } from './intl';
import type {
    CommonResourceFieldDefinition,
    FieldDefinition,
    InputSchema,
    InputSchemaBaseChecked,
    StringFieldDefinition,
} from './types';
import { ensureAjvSupportsDraft2019, validateRegexpPattern } from './utilities';

export { schema as inputSchema };

const { definitions } = schema;

// Because the definitions contain not only the root properties definitions, but also sub-schema definitions
// and utility definitions, we need to filter them out and validate only against the appropriate ones.
// We do this by checking the prefix of the definition title (Utils: or Sub-schema:)

const [fieldDefinitions, subFieldDefinitions] = Object
    .values<any>(definitions)
    .reduce<[any[], any[]]>((acc, definition) => {
        if (definition.title.startsWith('Utils:')) {
            // skip utility definitions
            return acc;
        }

        if (definition.title.startsWith('Sub-schema:')) {
            acc[1].push(definition);
        } else {
            acc[0].push(definition);
        }

        return acc;
    }, [[], []]);

/**
 * Retrieves a custom error message defined in the schema for a particular schema path.
 * @param rootSchema json schema object
 * @param schemaPath schema path to the failed validation keyword,
 *  as provided in an AJV error object, including the keyword at the end, e.g. "#/properties/name/type"
 */
export function getCustomErrorMessage(rootSchema: Record<string, any>, schemaPath: string): string | null {
    if (!schemaPath) return null;

    const pathParts = schemaPath
        .replace(/^#\//, '')
        .split('/')
        .filter(Boolean);

    // The last part is the keyword
    const keyword = pathParts.pop();
    if (!keyword) return null;

    // Navigate through the schema to find the relevant fragment
    let schemaFragment: Record<string, any> = rootSchema;
    for (const key of pathParts) {
        if (schemaFragment && typeof schemaFragment === 'object') {
            schemaFragment = schemaFragment[key];
        } else {
            return null;
        }
    }

    if (typeof schemaFragment !== 'object') {
        return null;
    }

    const { errorMessage } = schemaFragment;
    if (!errorMessage) return null;

    if (typeof errorMessage === 'object' && keyword in errorMessage) {
        return errorMessage[keyword];
    }

    return null;
}

/**
 * This function parses AJV error and transforms it into a readable string.
 *
 * @param error An error as returned from AJV.
 * @param rootName Usually 'input' or 'schema' based on if we are passing the input or schema.
 * @param properties (Used only when parsing input errors) List of input schema properties.
 * @param input (Used only when parsing input errors) Actual input that is being parsed.
 * @returns {null|{fieldKey: *, message: *}}
 */
export function parseAjvError(
    error: ErrorObject,
    rootName: string,
    properties: Record<string, { nullable?: boolean, editor?: string }> = {},
    input: Record<string, unknown> = {},
): { fieldKey: string; message: string } | null {
    // There are 3 possible errors comming from validation:
    // - either { keword: 'anything', instancePath: '/someField', message: 'error message that we can use' }
    // - or { keyword: 'additionalProperties', params: { additionalProperty: 'field' }, message: 'must NOT have additional properties' }
    // - or { keyword: 'required', instancePath: '', params.missingProperty: 'someField' }

    let fieldKey: string;
    let message: string;

    // remove leading and trailing slashes and replace remaining slashes with dots
    const cleanPropertyName = (name: string) => {
        return name.replace(/^\/|\/$/g, '').replace(/\//g, '.');
    };

    // First, try to get a custom error message from the schema
    // If found, use it directly and skip further processing
    const customError = getCustomErrorMessage({ properties }, error.schemaPath);
    if (customError) {
        fieldKey = cleanPropertyName(error.instancePath);
        return { fieldKey, message: customError };
    }

    // If error is with keyword type, it means that type of input is incorrect
    // this can mean that provided value is null
    if (error.keyword === 'type') {
        fieldKey = cleanPropertyName(error.instancePath);
        // Check if value is null and field is nullable, if yes, then skip this error
        if (properties[fieldKey] && properties[fieldKey].nullable && input[fieldKey] === null) {
            return null;
        }
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
    } else if (error.keyword === 'required') {
        fieldKey = cleanPropertyName(`${error.instancePath}/${error.params.missingProperty}`);
        message = m('inputSchema.validation.required', { rootName, fieldKey });
    } else if (error.keyword === 'additionalProperties') {
        fieldKey = cleanPropertyName(`${error.instancePath}/${error.params.additionalProperty}`);
        message = m('inputSchema.validation.additionalProperty', { rootName, fieldKey });
    } else if (error.keyword === 'unevaluatedProperties') {
        fieldKey = cleanPropertyName(`${error.instancePath}/${error.params.unevaluatedProperty}`);
        message = m('inputSchema.validation.additionalProperty', { rootName, fieldKey });
    } else if (error.keyword === 'enum') {
        fieldKey = cleanPropertyName(error.instancePath);
        const errorMessage = `${error.message}: "${error.params.allowedValues.join('", "')}"`;
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: errorMessage });
    } else if (error.keyword === 'const') {
        fieldKey = cleanPropertyName(error.instancePath);
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
    } else if (error.keyword === 'pattern' && error.propertyName && error.params?.pattern) {
        fieldKey = cleanPropertyName(`${error.instancePath}/${error.propertyName}`);
        message = m('inputSchema.validation.propertyName', { rootName, fieldKey, pattern: error.params.pattern });
    } else {
        fieldKey = cleanPropertyName(error.instancePath);
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
    }

    return { fieldKey, message };
}

/**
 * Validates given object against schema and throws a human-readable error.
 */
const validateAgainstSchemaOrThrow = (validator: Ajv, obj: Record<string, unknown>, inputSchema: Schema, rootName: string) => {
    if (validator.validate(inputSchema, obj)) return;

    const errorMessage = parseAjvError(validator.errors![0], rootName)?.message;
    throw new Error(`Input schema is not valid (${errorMessage})`);
};

/**
 * This validates given object only against the basic input schema without checking the particular fields.
 * We override schema.properties.properties not to validate field definitions.
 */
function validateBasicStructure(validator: Ajv, obj: Record<string, unknown>): asserts obj is InputSchemaBaseChecked {
    // We need to remove $id from the schema, because AJV cache the schema by id and if we provide
    // different schema instance with the same id, it will throw an error.
    const { $id, ...schemaWithoutId } = schema;
    const schemaWithoutProperties = {
        ...schemaWithoutId,
        properties: { ...schema.properties, properties: { type: 'object' } as any },
    };
    validateAgainstSchemaOrThrow(validator, obj, schemaWithoutProperties, 'schema');
}

/**
 * Validates particular field against it's schema.
 * @param validator An instance of AJV validator (must support draft 2019-09).
 * @param fieldSchema Schema of the field to validate.
 * @param fieldKey Key of the field in the input schema.
 * @param isSubField If true, the field is a sub-field of another field, so we need to skip some definitions.
 */
function validateFieldAgainstSchemaDefinition(
    validator: Ajv,
    fieldSchema: Record<string, unknown>,
    fieldKey: string,
    isSubField = false,
): asserts fieldSchema is FieldDefinition {
    const relevantDefinitions = isSubField ? subFieldDefinitions : fieldDefinitions;

    const matchingDefinitions = Object
        .values<any>(relevantDefinitions) // cast as any, as the code in first branch seems to be invalid
        .filter((definition) => {
            return definition.properties.type.enum
                // This is a normal case where fieldSchema.type can be only one possible value matching definition.properties.type.enum.0
                ? definition.properties.type.enum[0] === fieldSchema.type
                // This is a type "Any" where fieldSchema.type is an array of possible values
                : Array.isArray(fieldSchema.type);
        });

    // There is not matching definition.
    if (matchingDefinitions.length === 0) {
        const errorMessage = m('inputSchema.validation.noMatchingDefinition', { fieldKey });
        throw new Error(`Input schema is not valid (${errorMessage})`);
    }

    // We are validating a field schema against one of the definitions, but one definition can reference other definitions.
    // So this basically creates a new JSON Schema with a picked definition at root and puts all definitions from the `schema.json`
    // into the `definitions` property of this final schema.
    const enhanceDefinition = (definition: object) => {
        return {
            ...definition,
            definitions,
        };
    };

    // If there is only one matching then we are done and simply compare it.
    if (matchingDefinitions.length === 1) {
        validateAgainstSchemaOrThrow(validator, fieldSchema, enhanceDefinition(matchingDefinitions[0]), `schema.properties.${fieldKey}`);
        return;
    }

    // If there are more matching definitions then we need to get the right one.
    // If the definition contains "enum" property then it's enum type.
    if ((fieldSchema as StringFieldDefinition).enum) {
        const definition = matchingDefinitions.filter((item) => !!item.properties.enum).pop();
        if (!definition) throw new Error('Input schema validation failed to find "enum property" definition');
        validateAgainstSchemaOrThrow(validator, fieldSchema, enhanceDefinition(definition), `schema.properties.${fieldKey}`);
        return;
    }
    // If the definition contains "resourceType" property then it's resource type.
    if ((fieldSchema as CommonResourceFieldDefinition<unknown>).resourceType) {
        const definition = matchingDefinitions.filter((item) => !!item.properties.resourceType).pop();
        if (!definition) throw new Error('Input schema validation failed to find "resource property" definition');
        validateAgainstSchemaOrThrow(validator, fieldSchema, enhanceDefinition(definition), `schema.properties.${fieldKey}`);
        return;
    }
    // Otherwise we use the other definition.
    const definition = matchingDefinitions.filter((item) => !item.properties.enum && !item.properties.resourceType).pop();
    if (!definition) throw new Error('Input schema validation failed to find other than "enum property" definition');

    validateAgainstSchemaOrThrow(validator, fieldSchema, enhanceDefinition(definition), `schema.properties.${fieldKey}`);
}

/**
 * Validates particular field against it's schema and other rules (like regex patterns).
 * @param validator An instance of AJV validator (must support draft 2019-09).
 * @param fieldSchema Schema of the field to validate.
 * @param fieldKey Key of the field in the input schema.
 * @param isSubField If true, the field is a sub-field of another field, so we need to skip some definitions.
 */
function validateField(validator: Ajv, fieldSchema: Record<string, unknown>, fieldKey: string, isSubField = false): asserts fieldSchema is FieldDefinition {
    // Validate against schema definition first.
    validateFieldAgainstSchemaDefinition(validator, fieldSchema, fieldKey, isSubField);

    // Validate regex patterns if defined.
    if ('pattern' in fieldSchema && fieldSchema.pattern) {
        validateRegexpPattern(fieldSchema.pattern, `${fieldKey}.pattern`);
    }
    if ('patternKey' in fieldSchema && fieldSchema.patternKey) {
        validateRegexpPattern(fieldSchema.patternKey, `${fieldKey}.patternKey`);
    }
    if ('patternValue' in fieldSchema && fieldSchema.patternValue) {
        validateRegexpPattern(fieldSchema.patternValue, `${fieldKey}.patternValue`);
    }
    if ('propertyNames' in fieldSchema && fieldSchema.propertyNames?.pattern) {
        validateRegexpPattern(fieldSchema.propertyNames.pattern, `${fieldKey}.propertyNames.pattern`);
    }
    if ('patternProperties' in fieldSchema && fieldSchema.patternProperties?.['.*']?.pattern) {
        validateRegexpPattern(fieldSchema.patternProperties['.*'].pattern, `${fieldKey}.patternProperties.*.pattern`);
    }
}

/**
 * Validates all subfields (and their subfields) of a given field schema.
 */
function validateSubFields(validator: Ajv, fieldSchema: InputSchemaBaseChecked, fieldKey: string) {
    Object.entries(fieldSchema.properties).forEach(([subFieldKey, subFieldSchema]) => {
        // The sub-properties has to be validated first, so we got more relevant error messages.
        if (subFieldSchema.type === 'object' && subFieldSchema.properties) {
            // If the field has sub-fields, we need to validate them as well.
            validateSubFields(validator, subFieldSchema as any as InputSchemaBaseChecked, `${fieldKey}.${subFieldKey}`);
        }

        // If the field is an array and has defined schema (items property), we need to validate it differently.
        if (subFieldSchema.type === 'array' && subFieldSchema.items) {
            validateArrayField(validator, subFieldSchema, `${fieldKey}.${subFieldKey}`);
        }

        validateField(validator, subFieldSchema, `${fieldKey}.${subFieldKey}`, true);
    });
}

function validateArrayField(validator: Ajv, fieldSchema: { items?: { type: 'string', properties: Record<string, any> }}, fieldKey: string) {
    const arraySchema = (fieldSchema as any).items;
    if (!arraySchema) return;

    // If the array has object items and have sub-schema defined, we need to validate it.
    if (arraySchema.type === 'object' && arraySchema.properties) {
        validateSubFields(validator, arraySchema as InputSchemaBaseChecked, `${fieldKey}.items`);
    }

    // If it's an array of arrays we need, we need to validate the inner array schema.
    if (arraySchema.type === 'array' && arraySchema.items) {
        validateArrayField(validator, arraySchema, `${fieldKey}.items`);
    }
}

/**
 * Validates all properties in the input schema
 */
function validateProperties(inputSchema: InputSchemaBaseChecked, validator: Ajv): asserts inputSchema is InputSchema {
    Object.entries(inputSchema.properties).forEach(([fieldKey, fieldSchema]) => {
        // The sub-properties has to be validated first, so we got more relevant error messages.
        if (fieldSchema.type === 'object' && fieldSchema.properties) {
            // If the field has sub-fields, we need to validate them as well.
            validateSubFields(validator, fieldSchema as any as InputSchemaBaseChecked, fieldKey);
        }

        // If the field is an array and has defined schema (items property), we need to validate it differently.
        if (fieldSchema.type === 'array' && fieldSchema.items) {
            validateArrayField(validator, fieldSchema, fieldKey);
        }

        validateField(validator, fieldSchema, fieldKey);
    });
}

/**
 * Validates that all required fields are present in properties list
 */
export function validateExistenceOfRequiredFields(inputSchema: InputSchema) {
    // If the input schema does not have any required fields, we do not need to validate them
    if (!inputSchema?.required?.length) return;

    Object.values(inputSchema?.required).forEach((fieldKey) => {
        // If the required field is present in the list of properties, we can check the next one
        if (inputSchema?.properties[fieldKey as string]) return;

        // The required field is not defined in list of properties. Which means the schema is not valid.
        throw new Error(m('inputSchema.validation.missingRequiredField', { fieldKey }));
    });
}

/**
 * This function validates given input schema first just for basic structure then each field one by one,
 * then checks that all required fields are present and finally checks fully against the whole schema.
 *
 * This way we get the most accurate error message for user.
 *
 * @param validator An instance of AJV validator. Important: The JSON Schema that the passed input schema is validated against
 *  is using features from JSON Schema 2019 draft, so the AJV instance must support it.
 * @param inputSchema Input schema to validate.
 */
export function validateInputSchema(validator: Ajv, inputSchema: Record<string, unknown>): asserts inputSchema is InputSchema {
    ensureAjvSupportsDraft2019(validator);

    // First validate just basic structure without fields.
    validateBasicStructure(validator, inputSchema);

    // Then validate each field separately.
    validateProperties(inputSchema, validator);

    // Next validate if required fields are actually present in the schema
    validateExistenceOfRequiredFields(inputSchema);

    // Finally just to be sure run validation against the whole schema.
    validateAgainstSchemaOrThrow(validator, inputSchema, schema, 'schema');
}
