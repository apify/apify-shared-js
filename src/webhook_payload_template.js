const { JsonVariable, jsonStringifyExtended } = require('./utilities.client');

class WebhookPayloadTemplateError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidJsonError extends WebhookPayloadTemplateError {
    constructor(originalError) {
        super(originalError.message);
    }
}
export class InvalidVariableError extends Error {
    constructor(variable) {
        super(`Invalid payload template variable: ${variable}`);
    }
}

/**
 * WebhookPayloadTemplate enables creation and parsing of webhook payload template strings.
 * Template strings are JSON that may include template variables enclosed in double
 * curly brackets: `{{variable}}`. When the template is parsed, variables are replaced
 * with values from a provided context.
 *
 * This is useful to create dynamic webhook payloads where a template is saved on webhook
 * creation and then variables are dynamically added on webhook dispatch.
 *
 * **Example:**
 * ```js
 * const payloadTemplate = `{
 *    "id": "some-id",
 *    "createdAt": "2019-05-08T15:22:21.095Z",
 *    "dataToSend": {{data}}
 * }`
 *
 * const data = {
 *     status: 200,
 *     body: 'hello world'
 * }
 *
 * const payloadObject = WebhookPayloadTemplate.parse(payloadTemplate, null, { data })
 * ```
 *
 * **Produces:**
 * ```js
 * {
 *     id: "some-id",
 *    createdAt: '2019-05-08T15:22:21.095Z',
 *    dataToSend: {
 *        status: 200,
 *        body: 'hello world'
 *    }
 * }
 * ```
 * @hideconstructor
 */
export default class WebhookPayloadTemplate {
    constructor(payloadTemplate, allowedVariables = null, context = {}) {
        this.template = payloadTemplate;
        this.allowedVariables = allowedVariables;
        this.context = context;

        this.payload = this.template;
        this.replacedVariables = [];
    }

    /**
     * Parse existing webhook payload template string into an object, replacing
     * template variables using the provided context.
     *
     * Parse also validates the template structure, so it can be used
     * to check validity of the template JSON and usage of allowedVariables.
     * @param {string} payloadTemplate
     * @param {Set<string>|null} [allowedVariables=null]
     * @param {Object} [context={}]
     * @return {object}
     */
    static parse(payloadTemplate, allowedVariables, context) {
        const type = typeof payloadTemplate;
        if (type !== 'string') throw new Error(`Cannot parse a ${type} payload template.`);
        const template = new WebhookPayloadTemplate(payloadTemplate, allowedVariables, context);
        return template._parse(); // eslint-disable-line no-underscore-dangle
    }

    /**
     * Stringify an object into a webhook payload template.
     * Values created using `getTemplateVariable('foo.bar')`
     * will be stringified to `{{foo.bar}}` template variable.
     * @param {Object} objectTemplate
     * @param {Function} [replacer]
     * @param {number} [indent=2]
     * @return {string}
     */
    static stringify(objectTemplate, replacer, indent = 2) {
        const type = typeof objectTemplate;
        if (!objectTemplate || type !== 'object') throw new Error(`Cannot stringify a ${type} payload template.`);
        return jsonStringifyExtended(objectTemplate, replacer, indent);
    }

    /**
     * Produces an instance of a template variable that can be used
     * in objects and will be stringified into `{{variable}}` syntax.
     *
     * **Example:**
     * ```js
     * const resourceVariable = WebhookPayloadTemplate.getVariable('resource');
     * const objectTemplate = {
     *     foo: 'foo',
     *     bar: ['bar'],
     *     res: resourceVariable,
     * }
     *
     * const payloadTemplate = WebhookPayloadTemplate.stringify(objectTemplate);
     * ```
     *
     * **Produces:**
     * ```json
     * {
     *     "foo": "foo",
     *     "bar": ["bar"],
     *     "res": {{resource}},
     * }
     * ```
     *
     * @param {string} variable
     * @return {JsonVariable}
     */
    static getVariable(variable) {
        return new JsonVariable(variable);
    }

    /** @private */
    _parse() {
        while (true) { // eslint-disable-line no-constant-condition
            try {
                return JSON.parse(this.payload);
            } catch (err) {
                const index = this._parseIndexFromErrorMessage(err);
                if (this._isErrorCausedByVariable(index)) {
                    this._replaceVariable(index);
                } else {
                    throw new InvalidJsonError(err);
                }
            }
        }
    }

    /** @private */
    _parseIndexFromErrorMessage(err) { // eslint-disable-line class-methods-use-this
        const errorPosition = err.message.match(/(\d+)$/)[0];
        return Number(errorPosition);
    }

    /** @private */
    _isErrorCausedByVariable(errorIndex) {
        return this.payload[errorIndex - 1] === '{';
    }

    /** @private */
    _replaceVariable(startIndex) {
        const nextClosingBracesIndex = this.payload.indexOf('}}', startIndex);
        const variable = this.payload.substring(startIndex + 1, nextClosingBracesIndex);
        this._validateVariable(variable);
        const replacement = this._getVariableReplacement(variable);
        this.replacedVariables.push({ variable, replacement });
        this.payload = this.payload.replace(`{{${variable}}}`, replacement);
    }

    /** @private */
    _validateVariable(variable) {
        if (this.allowedVariables === null) return;
        const isVariableValid = this.allowedVariables.has(variable);
        if (!isVariableValid) throw new InvalidVariableError(variable);
    }

    /** @private */
    _getVariableReplacement(variable) {
        const replacement = this.context[variable];
        return replacement
            ? JSON.stringify(replacement)
            : null;
    }
}
