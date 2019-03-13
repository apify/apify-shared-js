const intlStrings = {
    'inputSchema.validation.generic': 'Field input.{fieldKey} {message}',
    'inputSchema.validation.required': 'Field input.{fieldKey} is required',
    'inputSchema.validation.proxyRequired': 'Field input.{fieldKey} is required. Please provide custom proxy URLs or use Apify Proxy.',
    'inputSchema.validation.arrayKeysInvalid': 'Keys in input.{fieldKey} at positions [{invalidIndexes}] should match pattern "{pattern}"',
    'inputSchema.validation.arrayValuesInvalid': 'Values in input.{fieldKey} at positions [{invalidIndexes}] should match pattern "{pattern}"',
    'inputSchema.validation.objectKeysInvalid': 'Keys [{invalidKeys}] in input.{fieldKey} should match pattern "{pattern}',
    'inputSchema.validation.objectValuesInvalid': 'Keys [{invalidKeys}] in input.{fieldKey} should have string value which matches pattern "{pattern}"',
    'inputSchema.validation.additionalProperty': 'Property {fieldKey} is not allowed.',
    'inputSchema.validation.proxyGroupsNotAvailable': 'You currently do not have access to proxy groups: {groups}',
};

// Helper function to simulate intl formatMessage function
exports.m = function (stringId, variables) {
    let text = intlStrings[stringId];
    if (!text) return stringId;

    Object.keys(variables).forEach((variableName) => {
        text = text.split(`{${variableName}}`).join(variables[variableName]);
    });

    return text;
};
