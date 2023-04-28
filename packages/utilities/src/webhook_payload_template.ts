/* eslint-disable max-classes-per-file */

import { JsonVariable, jsonStringifyExtended } from './utilities.client';

class WebhookPayloadTemplateError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class InvalidJsonError extends WebhookPayloadTemplateError {
    constructor(originalError: Error) {
        super(originalError.message);
    }
}
export class InvalidVariableError extends Error {
    constructor(variable?: string) {
        super(`Invalid payload template variable: ${variable}`);
    }
}

interface ParsePosition {
    isInsideString: boolean;
    openBraceIndex: number;
    closeBraceIndex: number;
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
export class WebhookPayloadTemplate {
    private payload = this.template;

    readonly replacedVariables: { variableName: string, replacement: string }[] = [];

    constructor(private readonly template: string,
                private readonly allowedVariables: Set<string> | null = null,
                private readonly context: Record<string, any> = {}) { }

    /**
     * Parse existing webhook payload template string into an object, replacing
     * template variables using the provided context.
     *
     * Parse also validates the template structure, so it can be used
     * to check validity of the template JSON and usage of allowedVariables.
     */
    static parse(payloadTemplate: string, allowedVariables: Set<string> | null = null, context: Record<string, any> = {}): Record<string, any> {
        const type = typeof payloadTemplate;
        if (type !== 'string') throw new Error(`Cannot parse a ${type} payload template.`);
        const template = new WebhookPayloadTemplate(payloadTemplate, allowedVariables, context);
        const data = template._parse(); // eslint-disable-line no-underscore-dangle
        return template._interpolate(data); // eslint-disable-line no-underscore-dangle
    }

    /**
     * Stringify an object into a webhook payload template.
     * Values created using `getTemplateVariable('foo.bar')`
     * will be stringified to `{{foo.bar}}` template variable.
     */
    static stringify(objectTemplate: Record<string, any>, replacer?: ((_: any) => string) | null, indent = 2): string {
        const type = typeof objectTemplate;
        if (!objectTemplate || type !== 'object') throw new Error(`Cannot stringify a ${type} payload template.`);
        return jsonStringifyExtended(objectTemplate, replacer, indent);
    }

    /**
     * Produces an instance of a template variable that can be used
     * in objects and will be stringified into `{{variableName}}` syntax.
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
     */
    static getVariable(variableName: string): JsonVariable {
        return new JsonVariable(variableName);
    }

    private _parse() {
        let currentIndex = 0;
        while (true) {
            // eslint-disable-line no-constant-condition
            try {
                return JSON.parse(this.payload);
            } catch (err) {
                const position = this._findPositionOfNextVariable(currentIndex);
                // When we catch an error from JSON.parse, but there's no remaining variable, we must have an invalid JSON.
                if (!position) {
                    throw new InvalidJsonError(err as Error);
                }
                if (!position.isInsideString) {
                    this._replaceVariable(position);
                }
                currentIndex = position.openBraceIndex + 1;
            }
        }
    }

    /**
     * Process variables that are inside strings.
     *
     * @param data
     * @returns
     */
    private _interpolate(data: Record<string, any>): Record<string, any> {
        return this._interpolateWhatever(data);
    }

    private _interpolateWhatever(value: any): any {
        if (typeof value === 'string') {
            return this._interpolateString(value);
        }
        // Array needs to go before object!
        if (Array.isArray(value)) {
            return this._interpolateArray(value);
        }
        if (typeof value === 'object' && value !== null) {
            return this._interpolateObject(value);
        }
        // We can't interpolate anything else
        return value;
    }

    // TODO: Just replace the variables in this case
    private _interpolateString(value: string): string {
        // If the string matches exactly, we return the variable value including the type
        if (value.match(/^\{\{var:([a-zA-Z0-9.]*)\}\}$/)) {
            const variableName = value.substring(6, value.length - 2);
            this._validateVariableName(variableName);
            return this._getVariableValue(variableName);
        }
        // If it's just a part of substring, we replace the respective variables with their string variants
        return value.replace(/\{\{var:([a-zA-Z0-9.]*)\}\}/g, (match, variableName) => {
            this._validateVariableName(variableName);
            const variableValue = this._getVariableValue(variableName);
            return `${variableValue}`;
        });
    }

    private _interpolateObject(value: Record<string, any>): Record<string, any> {
        const result = {};
        Object.entries(value).forEach(([key, v]) => {
            result[key] = this._interpolateWhatever(v);
        });
        return result;
    }

    private _interpolateArray(value: Array<any>): Array<any> {
        return value.map(this._interpolateWhatever.bind(this));
    }

    private _findPositionOfNextVariable(startIndex = 0): ParsePosition | null {
        const openBraceIndex = this.payload.indexOf('{{', startIndex);
        const closeBraceIndex = this.payload.indexOf('}}', openBraceIndex) + 1;
        const someVariableMaybeExists = (openBraceIndex > -1) && (closeBraceIndex > -1);
        if (!someVariableMaybeExists) return null;
        const isInsideString = this._isVariableInsideString(openBraceIndex);
        return { isInsideString, openBraceIndex, closeBraceIndex };
    }

    private _isVariableInsideString(openBraceIndex: number): boolean {
        const unescapedQuoteCount = this._countUnescapedDoubleQuotesUpToIndex(openBraceIndex);
        return unescapedQuoteCount % 2 === 1;
    }

    private _countUnescapedDoubleQuotesUpToIndex(index: number): number {
        const payloadSection = this.payload.substring(0, index);
        let unescapedQuoteCount = 0;
        for (let i = 0; i < payloadSection.length; i++) {
            const char = payloadSection[i];
            const prevChar = payloadSection[i - 1];
            if (char === '"' && prevChar !== '\\') {
                unescapedQuoteCount++;
            }
        }
        return unescapedQuoteCount;
    }

    private _replaceVariable({ openBraceIndex, closeBraceIndex }: ParsePosition): void {
        const variableName = this.payload.substring(openBraceIndex + 2, closeBraceIndex - 1);
        this._validateVariableName(variableName);
        const replacement = this._getVariableReplacement(variableName)!;
        this.replacedVariables.push({ variableName, replacement });
        this.payload = this.payload.replace(`{{${variableName}}}`, replacement);
    }

    private _validateVariableName(variableName: string): void {
        if (this.allowedVariables === null) return;
        const [variable] = variableName.split('.');

        // Properties of the variable are not validated on purpose
        // as they will later be set to null if not found.
        // This serves to enable dynamic variable structures.
        const isVariableValid = this.allowedVariables.has(variable);

        if (!isVariableValid) throw new InvalidVariableError(variableName);
    }

    private _getVariableValue(variableName: string): any {
        const [variable, ...properties] = variableName.split('.');
        const context = this.context[variable];
        const value = properties.reduce((ctx, prop) => {
            if (!ctx || typeof ctx !== 'object') return null;
            return ctx[prop];
        }, context);
        return value;
    }

    private _getVariableReplacement(variableName: string): string | null {
        const value = this._getVariableValue(variableName);
        return value ? JSON.stringify(value) : null;
    }
}
