import { parse } from 'acorn-loose';
import type { ValidateFunction } from 'ajv';
import type Ajv from 'ajv/dist/2019';
import { countries } from 'countries-list';

import { PROXY_URL_REGEX, URL_REGEX } from '@apify/consts';
import { isEncryptedValueForFieldSchema, isEncryptedValueForFieldType } from '@apify/input_secrets';

import { parseAjvError } from './input_schema';
import { m } from './intl';

/**
 * Validates input field configured with proxy editor
 * @param fieldKey Proxy field value
 * @param value Proxy field value
 * @param [isRequired] Whether the field is required or not
 * @param [options] Information about proxy groups availability
 * @param [options.hasAutoProxyGroups] Informs validation whether user has atleast one proxy group available in auto mode
 * @param [options.availableProxyGroups] List of available proxy groups
 * @param [options.disabledProxyGroups] Object with groupId as key and error message as value (mostly for residential/SERP)
 */
function validateProxyField(
    fieldKey: Record<string, unknown>,
    value: Record<string, any>,
    isRequired = false,
    options: { hasAutoProxyGroups?: boolean; availableProxyGroups?: string[]; disabledProxyGroups?: Record<string, unknown> } | null = null,
) {
    const fieldErrors: any[] = [];
    if (isRequired) {
        // Nullable error is already handled by AJV
        if (value === null) return fieldErrors;
        if (!value) {
            const message = m('inputSchema.validation.required', { rootName: 'input', fieldKey });
            fieldErrors.push(message);
            return fieldErrors;
        }

        const { useApifyProxy, proxyUrls } = value;
        if (!useApifyProxy && (!Array.isArray(proxyUrls) || proxyUrls.length === 0)) {
            fieldErrors.push(m('inputSchema.validation.proxyRequired', { rootName: 'input', fieldKey }));
            return fieldErrors;
        }
    }

    // Input is not required, so missing value is valid
    if (!value) return fieldErrors;

    const { useApifyProxy, proxyUrls, apifyProxyGroups, apifyProxyCountry } = value;

    if (!useApifyProxy && Array.isArray(proxyUrls)) {
        let invalidUrl = false;
        proxyUrls.forEach((url) => {
            if (!PROXY_URL_REGEX.test(url.trim())) invalidUrl = url.trim();
        });
        if (invalidUrl) {
            fieldErrors.push(m('inputSchema.validation.customProxyInvalid', { invalidUrl }));
        }
    }

    // Apify proxy country can be set only when using Apify proxy
    if (!useApifyProxy && apifyProxyCountry) {
        fieldErrors.push(m('inputSchema.validation.apifyProxyCountryWithoutApifyProxyForbidden'));
    }

    // If Apify proxy is not used skip additional checks
    if (!useApifyProxy) return fieldErrors;

    // If Apify proxy is used, check if there is a selected country and if so, check that it's valid (empty or a valid country code)
    if (apifyProxyCountry && !countries[apifyProxyCountry as keyof typeof countries]) {
        fieldErrors.push(m('inputSchema.validation.apifyProxyCountryInvalid', { invalidCountry: apifyProxyCountry }));
    }

    // If options are not provided skip additional checks
    if (!options) return fieldErrors;

    // if apifyProxyGroups exists it must be an array of strings
    const isStringsArray = (array: string[]) => array.every((item) => typeof item === 'string');
    if (apifyProxyGroups && !(Array.isArray(apifyProxyGroups) && isStringsArray(apifyProxyGroups))) {
        fieldErrors.push(m('inputSchema.validation.proxyGroupMustBeArrayOfStrings', { rootName: 'input', fieldKey }));
        return fieldErrors;
    }

    const selectedProxyGroups = (apifyProxyGroups || []);

    // Auto mode, check that user has access to alteast one proxy group usable in this mode
    if (!selectedProxyGroups.length && !options.hasAutoProxyGroups) {
        fieldErrors.push(m('inputSchema.validation.noAvailableAutoProxy'));
        return fieldErrors;
    }

    // Check if proxy groups selected by user are available to him
    const availableProxyGroupsById = {} as Record<string, boolean>;
    (options.availableProxyGroups || []).forEach((group) => { availableProxyGroupsById[group] = true; });
    const unavailableProxyGroups = selectedProxyGroups.filter((group: string) => !availableProxyGroupsById[group]);

    if (unavailableProxyGroups.length) {
        fieldErrors.push(m('inputSchema.validation.proxyGroupsNotAvailable', {
            rootName: 'input',
            fieldKey,
            groups: unavailableProxyGroups.join(', '),
        }));
    }

    // Check if any of the proxy groups are blocked and if yes then output the associated message
    const blockedProxyGroupsById = options.disabledProxyGroups || {};
    selectedProxyGroups
        .filter((group: string) => blockedProxyGroupsById[group])
        .forEach((blockedGroup: string) => {
            fieldErrors.push(blockedProxyGroupsById[blockedGroup]);
        });

    return fieldErrors;
}

/**
 * Uses AJV validator to validate input with input schema and then
 * does custom validation for our own properties (nullable, patternKey, patternValue)
 * @param validator Initialized AJV validator
 * @param inputSchema Valid input schema in object
 * @param input Input object to be validated
 * @param options (Optional) Additional validation configuration for certain fields
 */
export function validateInputUsingValidator(
    validator: ValidateFunction,
    inputSchema: Record<string, any>,
    input: Record<string, unknown>,
    options: Record<string, any> = {},
) {
    const isValid = validator(input); // Check if input is valid based on schema values

    const { properties } = inputSchema;
    const required = inputSchema.required || [];

    let errors: { fieldKey: string, message: string }[] = [];
    // Process AJV validation errors
    if (!isValid) {
        errors = validator.errors!
            .filter((error) => {
                // We are storing encrypted objects/arrays as strings, so AJV will throw type the error here.
                // So we need to skip these errors.
                if (error.keyword === 'type' && error.instancePath) {
                    const path = error.instancePath.replace(/^\//, '').split('/')[0];
                    const propSchema = inputSchema.properties?.[path];
                    const value = input[path];

                    // Check if the property is a secret and if the value is an encrypted value.
                    // We do additional validation of the field schema in the later part of this function
                    if (
                        propSchema?.isSecret
                        && typeof value === 'string'
                        && (propSchema.type === 'object' || propSchema.type === 'array')
                        && isEncryptedValueForFieldType(value, propSchema.type)
                    ) {
                        return false;
                    }
                }
                return true;
            })
            .map((error) => parseAjvError(error, 'input', properties, input))
            .filter((error) => !!error) as any[];
    }

    Object.keys(properties).forEach((property) => {
        const value = input[property];
        const { type, editor, patternKey, patternValue, isSecret } = properties[property];
        const fieldErrors = [];
        // Check that proxy is required, if yes, valides that it's correctly setup
        if (type === 'object' && editor === 'proxy') {
            const proxyValidationErrors = validateProxyField(property as any, value as Record<string, any>, required.includes(property), options.proxy);
            proxyValidationErrors.forEach((error) => {
                fieldErrors.push(error);
            });
        }
        // Check that array items fit patternKey and patternValue
        if (type === 'array' && value && Array.isArray(value)) {
            if (editor === 'requestListSources') {
                const invalidIndexes: any[] = [];
                value.forEach((item, index) => {
                    if (!item) invalidIndexes.push(index);
                    else if (!item.url && !item.requestsFromUrl) invalidIndexes.push(index);
                    else if (item.url && !URL_REGEX.test(item.url)) invalidIndexes.push(index);
                    else if (item.requestsFromUrl && !URL_REGEX.test(item.requestsFromUrl)) invalidIndexes.push(index);
                });
                if (invalidIndexes.length) {
                    fieldErrors.push(m('inputSchema.validation.requestListSourcesInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidIndexes: invalidIndexes.join(','),
                    }));
                }
            }
            // If patternKey is provided, then validate keys of objects in array
            if (patternKey && editor === 'keyValue') {
                const check = new RegExp(patternKey);
                const invalidIndexes: any[] = [];
                value.forEach((item, index) => {
                    if (!check.test(item.key)) invalidIndexes.push(index);
                });
                if (invalidIndexes.length) {
                    fieldErrors.push(m('inputSchema.validation.arrayKeysInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidIndexes: invalidIndexes.join(','),
                        pattern: patternKey,
                    }));
                }
            }
            // If patternValue is provided and editor is keyValue, then validate values of objecs in array
            if (patternValue && editor === 'keyValue') {
                const check = new RegExp(patternValue);
                const invalidIndexes: any[] = [];
                value.forEach((item, index) => {
                    if (!check.test(item.value)) invalidIndexes.push(index);
                });
                if (invalidIndexes.length) {
                    fieldErrors.push(m('inputSchema.validation.arrayValuesInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidIndexes: invalidIndexes.join(','),
                        pattern: patternValue,
                    }));
                }
            // If patternValue is provided and editor is stringList, then validate each item in array
            } else if (patternValue && editor === 'stringList') {
                const check = new RegExp(patternValue);
                const invalidIndexes: any[] = [];
                value.forEach((item, index) => {
                    if (!check.test(item)) invalidIndexes.push(index);
                });
                if (invalidIndexes.length) {
                    fieldErrors.push(m('inputSchema.validation.arrayValuesInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidIndexes: invalidIndexes.join(','),
                        pattern: patternValue,
                    }));
                }
            }
        }
        // Check that object items fit patternKey and patternValue
        if (type === 'object' && value && typeof value === 'object') {
            if (patternKey) {
                const check = new RegExp(patternKey);
                const invalidKeys: any[] = [];
                Object.keys(value).forEach((key) => {
                    if (!check.test(key)) invalidKeys.push(key);
                });
                if (invalidKeys.length) {
                    fieldErrors.push(m('inputSchema.validation.objectKeysInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidKeys: invalidKeys.join(','),
                        pattern: patternKey,
                    }));
                }
            }
            if (patternValue) {
                const check = new RegExp(patternValue);
                const invalidKeys: any[] = [];
                Object.keys(value).forEach((key) => {
                    const propertyValue = (value as Record<string, any>)[key];
                    if (typeof propertyValue !== 'string' || !check.test(propertyValue)) invalidKeys.push(key);
                });
                if (invalidKeys.length) {
                    fieldErrors.push(m('inputSchema.validation.objectValuesInvalid', {
                        rootName: 'input',
                        fieldKey: property,
                        invalidKeys: invalidKeys.join(','),
                        pattern: patternValue,
                    }));
                }
            }
        }

        // Additional validation for secret fields
        if (isSecret && value && typeof value === 'string') {
            // If the value is a valid encrypted string for the field type,
            // we check if the field schema is likely to be still valid (is unchanged from the time of encryption).
            if (isEncryptedValueForFieldType(value, type) && !isEncryptedValueForFieldSchema(value, properties[property])) {
                // If not, we add an error message to the field errors and user needs to update the value in the input editor.
                fieldErrors.push(m('inputSchema.validation.secretFieldSchemaChanged', { fieldKey: property }));
            }
        }

        if (fieldErrors.length > 0) {
            const message = fieldErrors.join(', ');
            errors.push({ fieldKey: property, message });
        }
    });

    return errors;
}

/**
 * This functions parses all given JSON and then takes each of the jsFields.
 * Then if the field:
 * - is valid JS single function it replaces its single line string with a function delacation.
 * - is valid multiline JS code then replaces its single line string with `multiline` string
 * Then stringifies the code with given number of jsonSpacing spaces and finally prefixes whole
 * stringified JSON except the first line with globalSpacing spaces.
 */
export function makeInputJsFieldsReadable(json: string, jsFields: string[], jsonSpacing = 4, globalSpacing = 0): string {
    const parsedJson = JSON.parse(json);
    const replacements: Record<string, any> = {};

    jsFields.forEach((field) => {
        let maybeFunction = parsedJson[field];
        if (!maybeFunction || typeof maybeFunction !== 'string') return;

        let ast;
        try {
            ast = parse(maybeFunction, { ecmaVersion: 'latest' });
        } catch {
            // Don't do anything in a case of invalid JS code.
            return;
        }

        const isMultiline = maybeFunction.includes('\n');
        const isSingleFunction = ast
            && ast.body.length === 1
            && (
                ast.body[0].type === 'FunctionDeclaration'
                || (ast.body[0].type === 'ExpressionStatement' && ast.body[0].expression.type === 'ArrowFunctionExpression')
            );

        // If it's not a function declaration or multiline JS code then we do nothing.
        if (!isSingleFunction && !isMultiline) return;

        const spaces = (new Array(isSingleFunction ? jsonSpacing : jsonSpacing * 2)).fill(' ').join('');
        maybeFunction = maybeFunction
            .split('\n').join(`\n${spaces}`) // This prefixes each line with spaces.
            .trim(); // Trim whitespace on both sides

        const replacementValue = isSingleFunction
            ? maybeFunction.replace(/[;]+$/g, '') // Remove trailing semicolons
            : `\`${maybeFunction}\``;
        const replacementToken = `<<<REPLACEMENT_TOKEN:${Math.random()}>>>`;
        replacements[replacementToken] = replacementValue;
        parsedJson[field] = replacementToken;
    });

    let niceJson = JSON.stringify(parsedJson, null, jsonSpacing);

    Object.entries(replacements).forEach(([replacementToken, replacementValue]) => {
        niceJson = niceJson.replace(`"${replacementToken}"`, replacementValue);
    });

    const globalSpaces = (new Array(globalSpacing)).fill(' ').join('');
    niceJson = niceJson.split('\n').join(`\n${globalSpaces}`);

    return niceJson;
}

const DRAFT_2019_09_META_SCHEMA = 'https://json-schema.org/draft/2019-09/schema';

export function ensureAjvSupportsDraft2019(ajvInstance: Ajv) {
    const metaSchema = ajvInstance.getSchema(DRAFT_2019_09_META_SCHEMA);
    if (!metaSchema) {
        throw new Error(
            `The provided Ajv instance does not support draft-2019-09 (missing meta-schema ${DRAFT_2019_09_META_SCHEMA}).`,
        );
    }
}

/**
 * Validates that the provided pattern is a valid and safe regular expression.
 * @param pattern The regular expression pattern to validate.
 * @param fieldKey The field key where the pattern is used (for error messages).
 */
export function validateRegexpPattern(pattern: string, fieldKey: string) {
    try {
        // Validate that the pattern is a valid regular expression
        // eslint-disable-next-line
        new RegExp(pattern);
    } catch {
        const message = m('inputSchema.validation.regexpNotValid', { pattern, fieldKey });
        throw new Error(`Input schema is not valid (${message})`);
    }

    // TODO: add check for safe regex but figure out how to avoid false positives with some valid regexes
    // Check if the regex is safe (to avoid ReDoS attacks)
    // if (!safe(regex)) {
    //     const message = m('inputSchema.validation.regexpNotSafe', { pattern, fieldKey });
    //     throw new Error(`Input schema is not valid (${message})`);
    // }
}
