import type { ErrorObject, Schema } from 'ajv';
import type Ajv from 'ajv';

import { m } from './intl';
import schema from './schema.json';
import type {
    CommonResourceFieldDefinition,
    FieldDefinition,
    InputSchema,
    InputSchemaBaseChecked,
    StringFieldDefinition,
} from './types';

export { schema as inputSchema };

const { definitions } = schema;

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

    const cleanPropertyName = (name: string) => {
        // remove leading and trailing slashes and replace remaining slashes with dots
        return name.replace(/^\/|\/$/g, '').replace(/\//g, '.');
    };

    // If error is with keyword type, it means that type of input is incorrect
    // this can mean that provided value is null
    if (error.keyword === 'type') {
        fieldKey = error.instancePath.split('/').pop()!;
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
    } else if (error.keyword === 'enum') {
        fieldKey = cleanPropertyName(error.instancePath);
        const errorMessage = `${error.message}: "${error.params.allowedValues.join('", "')}"`;
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: errorMessage });
    } else if (error.keyword === 'const') {
        fieldKey = cleanPropertyName(error.instancePath);
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
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
    const schemaWithoutProperties = {
        ...schema,
        properties: { ...schema.properties, properties: { type: 'object' } as any },
    };
    validateAgainstSchemaOrThrow(validator, obj, schemaWithoutProperties, 'schema');
}

/**
 * Validates particular field against it's schema.
 */
function validateField(validator: Ajv, fieldSchema: Record<string, unknown>, fieldKey: string, subField = false): asserts fieldSchema is FieldDefinition {
    const matchingDefinitions = Object
        .values<any>(definitions) // cast as any, as the code in first branch seems to be invalid
        .filter((definition) => {
            if (definition.title.startsWith('Utils')) {
                // Utility definitions are not used for property validation.
                // They are used for their internal logic.
                return false;
            }
            if (!subField && definition.title.startsWith('Sub-schema')) {
                // This is a sub-schema definition, so we skip it.
                return false;
            }
            if (subField && !definition.title.startsWith('Sub-schema')) {
                // This is a normal definition, so we skip it.
                return false;
            }

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

    // When validating against schema of one definition, the definition can reference other definitions.
    // So we need to add all of them to the schema.
    function enhanceDefinition(definition: any) {
        return {
            ...definition,
            definitions,
        };
    }

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
        validateAgainstSchemaOrThrow(validator, fieldSchema, enhanceDefinition(definition), `schema.properties.${fieldKey}.enum`);
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

function validateSubFields(validator: Ajv, fieldSchema: InputSchemaBaseChecked, fieldKey: string) {
    Object.entries(fieldSchema.properties).forEach(([subFieldKey, subFieldSchema]) => (
        validateField(validator, subFieldSchema, `${fieldKey}.${subFieldKey}`, true)),
    );
}

/**
 * Validates all properties in the input schema
 */
function validateProperties(inputSchema: InputSchemaBaseChecked, validator: Ajv): asserts inputSchema is InputSchema {
    Object.entries(inputSchema.properties).forEach(([fieldKey, fieldSchema]) => {
        // The sub-properties has to be validated first, so we got more relevant error messages.
        if ((fieldSchema as any).properties) {
            // If the field has sub-fields, we need to validate them as well.
            validateSubFields(validator, fieldSchema as any as InputSchemaBaseChecked, fieldKey);
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
 */
export function validateInputSchema(validator: Ajv, inputSchema: Record<string, unknown>): asserts inputSchema is InputSchema {
    // First validate just basic structure without fields.
    validateBasicStructure(validator, inputSchema);

    // Then validate each field separately.
    validateProperties(inputSchema, validator);

    // Next validate if required fields are actually present in the schema
    validateExistenceOfRequiredFields(inputSchema);

    // Finally just to be sure run validation against the whole schema.
    validateAgainstSchemaOrThrow(validator, inputSchema, schema, 'schema');
}
