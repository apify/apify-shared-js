const intlStrings = {
    'inputSchema.validation.hasErrors': 'See more details errors bellow.',
    'inputSchema.validation.generic': 'Field input.{fieldKey} {message}',
    'inputSchema.validation.required': 'Field input.{fieldKey} is required',
    'inputSchema.validation.proxyRequired': 'Field input.{fieldKey} is required. Please provide custom proxy URLs or use Apify Proxy.',
    'inputSchema.validation.arrayKeysInvalid': 'Keys in input.{fieldKey} at positions [{invalidIndexes}] should match pattern "{pattern}"',
    'inputSchema.validation.arrayValuesInvalid': 'Values in input.{fieldKey} at positions [{invalidIndexes}] should match pattern "{pattern}"',
    'inputSchema.validation.objectKeysInvalid': 'Keys [{invalidKeys}] in input.{fieldKey} should match pattern "{pattern}',
    'inputSchema.validation.objectValuesInvalid': 'Keys [{invalidKeys}] in input.{fieldKey} should have string value which matches pattern "{pattern}"',
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
