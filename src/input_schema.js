import _ from 'underscore';
import schema from './input_schema.json';
import { m } from './intl';

const { definitions } = schema;

/**
 * This function parses AJV error and transformes it into a redable string.
 *
 * @param error An error as returned from AJV.
 * @param rootName Usually 'input' or 'schema' based on if we are passing the input or schema.
 * @param properties (Used only when parsing input errors) List of input schema properties.
 * @param input (Used only when parsing input errors) Actual input that is being parsed.
 * @returns {null|{fieldKey: *, message: *}}
 */
export const parseAjvError = (error, rootName, properties = {}, input = {}) => {
    // There are 3 possible errors comming from validation:
    // - either { keword: 'anything', dataPath: '.someField', message: 'error message that we can use' }
    // - or { keyword: 'additionalProperties', params: { additionalProperty: 'field' }, message: 'should NOT have additional properties' }
    // - or { keyword: 'required', dataPath: '', params.missingProperty: 'someField' }

    let fieldKey;
    let message;

    // If error is with keyword type, it means that type of input is incorrect
    // this can mean that provided value is null
    if (error.keyword === 'type') {
        fieldKey = error.dataPath.split('.').pop();
        // Check if value is null and field is nullable, if yes, then skip this error
        if (properties[fieldKey] && properties[fieldKey].nullable && input[fieldKey] === null) {
            return null;
        }
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
    } else if (error.keyword === 'required') {
        fieldKey = error.params.missingProperty;
        message = m('inputSchema.validation.required', { rootName, fieldKey });
    } else if (error.keyword === 'additionalProperties') {
        fieldKey = error.params.additionalProperty;
        message = m('inputSchema.validation.additionalProperty', { rootName, fieldKey });
    } else {
        fieldKey = error.dataPath.split('.').pop();
        message = m('inputSchema.validation.generic', { rootName, fieldKey, message: error.message });
    }

    return { fieldKey, message };
};

/**
 * Validates given object against schema and throws a human readable error.
 */
const validateAgainstSchemaOrThrow = (validator, obj, inputSchema, rootName) => {
    if (validator.validate(inputSchema, obj)) return;

    const errorMessage = parseAjvError(validator.errors[0], rootName).message;
    throw new Error(`Input schema is not valid (${errorMessage})`);
};

/**
 * This validates given object only against the basic input schema without checking the particular fields.
 * We override schema.properties.properties not to validate field defitions.
 */
const validateBasicStructure = (validator, obj) => {
    const schemaWithoutProperties = { ...schema };
    schemaWithoutProperties.properties = { ...schema.properties, properties: { type: 'object' } };
    validateAgainstSchemaOrThrow(validator, obj, schemaWithoutProperties, 'schema');
};

/**
 * Validates particular field against it's schema.
 */
const validateField = (validator, fieldSchema, fieldKey) => {
    const matchingDefinitions = Object
        .values(definitions)
        .filter((definition) => {
            return definition.properties.type.enum
                // This is a normal case where fieldSchema.type can be only one possible value matching definition.properties.type.enum.0
                ? definition.properties.type.enum[0] === fieldSchema.type
                // This is a type "Any" where fieldSchema.type is an array of possible values
                : _.isArray(fieldSchema.type);
        });

    // There is not matching definition.
    if (matchingDefinitions.length === 0) {
        const errorMessage = m('inputSchema.validation.noMatchingDefinition', { fieldKey });
        throw new Error(`Input schema is not valid (${errorMessage})`);
    }

    // If there is only one matching then we are done and simply compare it.
    if (matchingDefinitions.length === 1) {
        validateAgainstSchemaOrThrow(validator, fieldSchema, matchingDefinitions[0], `schema.properties.${fieldKey}`);
        return;
    }

    // If there are more matching definitions then the type is string and we need to get the right one.
    // If the definition contains "enum" property then it's enum type.
    if (fieldSchema.enum) {
        const definition = matchingDefinitions.filter((item) => !!item.properties.enum).pop();
        if (!definition) throw new Error('Input schema validation failed to find "enum property" definition');
        validateAgainstSchemaOrThrow(validator, fieldSchema, definition, `schema.properties.${fieldKey}`);
        return;
    }
    // Otherwise we use the other definition.
    const definition = matchingDefinitions.filter((item) => !item.properties.enum).pop();
    if (!definition) throw new Error('Input schema validation failed to find other than "enum property" definition');

    validateAgainstSchemaOrThrow(validator, fieldSchema, definition, `schema.properties.${fieldKey}`);
};

/**
 * This function validates given input schema first just for basic structure then each field one by one and
 * finally fully against the whole schema.
 *
 * This way we get the most accurate error message for user.
 */
export const validateInputSchema = (validator, inputSchema) => {
    // First validate just basic structure without fields.
    validateBasicStructure(validator, inputSchema);

    // Then validate each field speparately.
    _.mapObject(inputSchema.properties, (fieldSchema, fieldKey) => validateField(validator, fieldSchema, fieldKey));

    // Finally just to be sure run validation against the whole shema.
    validateAgainstSchemaOrThrow(validator, inputSchema, schema, 'schema');
};
