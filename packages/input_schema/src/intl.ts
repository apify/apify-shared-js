/* eslint-disable max-len,quotes,quote-props */
const intlStrings = {
    'inputSchema.validation.generic':
        'Field {rootName}.{fieldKey} {message}',
    'inputSchema.validation.required':
        'Field {rootName}.{fieldKey} is required',
    'inputSchema.validation.proxyRequired':
        'Field {rootName}.{fieldKey} is required. Please provide custom proxy URLs or use Apify Proxy.',
    'inputSchema.validation.requestListSourcesInvalid':
        'Items in {rootName}.{fieldKey} at positions [{invalidIndexes}] do not contain valid URLs',
    'inputSchema.validation.arrayKeysInvalid':
        'Keys in {rootName}.{fieldKey} at positions [{invalidIndexes}] must match regular expression "{pattern}"',
    'inputSchema.validation.arrayValuesInvalid':
        'Values in {rootName}.{fieldKey} at positions [{invalidIndexes}] must match regular expression "{pattern}"',
    'inputSchema.validation.objectKeysInvalid':
        'Keys [{invalidKeys}] in {rootName}.{fieldKey} must match regular expression "{pattern}',
    'inputSchema.validation.objectValuesInvalid':
        'Keys [{invalidKeys}] in {rootName}.{fieldKey} must have string value which matches regular expression "{pattern}"',
    'inputSchema.validation.additionalProperty':
        'Property {rootName}.{fieldKey} is not allowed.',
    'inputSchema.validation.proxyGroupsNotAvailable':
        'You currently do not have access to proxy groups: {groups}',
    'inputSchema.validation.customProxyInvalid':
        'Proxy URL "{invalidUrl}" has invalid format, it must be http://[username[:password]]@hostname:port.',
    'inputSchema.validation.apifyProxyCountryInvalid':
        'Country code "{invalidCountry}" is invalid. Only ISO 3166-1 alpha-2 country codes are supported.',
    'inputSchema.validation.apifyProxyCountryWithoutApifyProxyForbidden':
        'The country for Apify Proxy can be specified only when using Apify Proxy.',
    'inputSchema.validation.noAvailableAutoProxy':
        'Currently you do not have access to any proxy group usable in automatic mode.',
    'inputSchema.validation.noMatchingDefinition':
        'Field schema.properties.{fieldKey} is not matching any input schema type definition. Please make sure that it\'s type is valid.',
    'inputSchema.validation.missingRequiredField':
        'Field schema.properties.{fieldKey} does not exist, but it is specified in schema.required. Either define the field or remove it from schema.required.',
};
/* eslint-enable max-len,quotes,quote-props */

/**
 * Helper function to simulate intl formatMessage function
 */
export function m(stringId: string, variables?: Record<string, any>) {
    let text = intlStrings[stringId];
    if (!text) return stringId;

    if (variables) {
        Object.keys(variables).forEach((variableName) => {
            text = text.split(`{${variableName}}`).join(variables[variableName]);
        });
    }

    return text;
}
