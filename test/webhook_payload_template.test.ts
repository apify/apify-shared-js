import { WebhookPayloadTemplate, InvalidJsonError, InvalidVariableError } from '@apify/utilities';
import { WEBHOOK_DEFAULT_PAYLOAD_TEMPLATE, WEBHOOK_ALLOWED_PAYLOAD_VARIABLES } from '@apify/consts';

const validJson = `
{
    "id": "some-id",
    "createdAt": "2019-05-08T15:22:21.095Z",
    "dataToSend": "{{data}}"
}
`;

const validTemplate = `
{
    "userId": [{{userId}}],
    "eventType": {{eventType}},
    "createdAt": {{createdAt}},
    "eventData": [{ "tmpl": {{eventData}} }],
    "resource": {{resource}}
}
`;

const validTemplateWithVariableInString = `
{
    "foo": "bar\\"{{foo}}\\"",
    "bar": {{xyz}},
    "baz": "{{foo}}"
}
`;

const invalidTemplateWithVariableInString = `
{
    "foo": "bar"{{foo}}",
    "bar": {{xyz}}
}
`;

const invalidJson = `
{
    "id": "some-id",
    "createdAt": "2019-05-08T15:22:21.095Z",,
    "dataToSend": "{{data}}"
}
`;

describe('WebhookPayloadTemplate', () => {
    it('should parse template without variables', () => {
        const payload = WebhookPayloadTemplate.parse(validJson);
        expect(payload).toEqual({
            id: 'some-id',
            createdAt: '2019-05-08T15:22:21.095Z',
            dataToSend: '{{data}}',
        });
    });

    it('should parse template with variables', () => {
        const payload = WebhookPayloadTemplate.parse(validTemplate);
        expect(payload).toEqual({
            userId: [null],
            eventType: null,
            createdAt: null,
            eventData: [{ tmpl: null }],
            resource: null,
        });
    });

    it('should fill template with variables using context', () => {
        const context = {
            userId: 'some-user-id',
            eventData: {
                status: 200,
                body: 'hello-world',
                messages: [1, 2, 3],
            },
        };
        const payload = WebhookPayloadTemplate.parse(validTemplate, null, context);
        expect(payload).toEqual({
            userId: ['some-user-id'],
            eventType: null,
            createdAt: null,
            eventData: [{
                tmpl: {
                    status: 200,
                    body: 'hello-world',
                    messages: [1, 2, 3],
                } }],
            resource: null,
        });
    });

    it('should parse default template with allowed variables', () => {
        const context = {
            userId: 'some-user-id',
            eventData: {
                someData: 1,
            },
            createdAt: new Date().toString(),
            eventType: 'ACTOR.RUN.SUCCEEDED',
            resource: {
                someResource: 2,
            },
        };
        const payload = WebhookPayloadTemplate.parse(WEBHOOK_DEFAULT_PAYLOAD_TEMPLATE, WEBHOOK_ALLOWED_PAYLOAD_VARIABLES, context);
        expect(payload).toEqual(context);
    });

    it('does not replace variables in strings by default', () => {
        const payload = WebhookPayloadTemplate.parse(validTemplateWithVariableInString);
        expect(payload.foo).toBe('bar"{{foo}}"');

        try {
            WebhookPayloadTemplate.parse(invalidTemplateWithVariableInString);
            throw new Error('Wrong error.');
        } catch (err) {
            expect(err).toBeInstanceOf(InvalidJsonError);
        }
    });

    it('replaces variables in strings if interpolateStrings=true', () => {
        const context = {
            foo: 'hello',
            lol: 'world',
            resource: {
                defaultDatasetId: 'dataset-123',
            },
            arrayField: [1, 2, 3],
        };
        const payload = WebhookPayloadTemplate.parse(`
        {
            "justVariable": "{{foo}}",
            "someOtherContent": "bar{{foo}}",
            "twoVariables": "bar{{foo}}baz{{foo}}bar{{lol}}",
            "bar": {{xyz}},
            "datasetId": "{{resource.defaultDatasetId}}",
            "arrayField": "{{arrayField}}",
            "arrayFieldInString": "This is my array {{arrayField}}",
            "resourceWrapped": "{{resource}}",
            "resourceDirect": {{resource}},
            "resourceInString": "This is my object {{resource}}"
        }`, null, context, { interpolateStrings: true });
        expect(payload.justVariable).toBe('hello');
        expect(payload.someOtherContent).toBe('barhello');
        expect(payload.twoVariables).toBe('barhellobazhellobarworld');
        expect(payload.bar).toBe(null);
        expect(payload.datasetId).toBe('dataset-123');
        expect(payload.arrayField).toStrictEqual(context.arrayField);
        expect(payload.arrayFieldInString).toBe('This is my array 1,2,3');
        expect(payload.resourceWrapped).toStrictEqual(context.resource);
        expect(payload.resourceDirect).toStrictEqual(context.resource);
        expect(payload.resourceInString).toBe('This is my object [object Object]');
    });

    it('should throw InvalidJsonError on invalid json', () => {
        try {
            WebhookPayloadTemplate.parse(invalidJson);
            throw new Error('Wrong error.');
        } catch (_err) {
            const err = _err as Error;
            expect(err.message).toBe('Unexpected token , in JSON at position 68');
            expect(err).toBeInstanceOf(InvalidJsonError);
        }
    });

    it('should throw InvalidVariableError on invalid variable', () => {
        const allowedVars = new Set(['userId', 'eventData']);
        try {
            WebhookPayloadTemplate.parse(validTemplate, allowedVars);
            throw new Error('Wrong error.');
        } catch (_err) {
            const err = _err as Error;
            expect(err.message).toBe('Invalid payload template variable: eventType');
            expect(err).toBeInstanceOf(InvalidVariableError);
        }
    });

    it('should stringify object payload templates', () => {
        const numVar = WebhookPayloadTemplate.getVariable('num');
        const bodyVar = WebhookPayloadTemplate.getVariable('body');
        const objTemplate = {
            hello: 'world',
            num: numVar,
            data: {
                status: 304,
                body: bodyVar,
            },
        };

        const payloadTemplate = WebhookPayloadTemplate.stringify(objTemplate, null, 0);
        expect(payloadTemplate).toBe('{"hello":"world","num":{{num}},"data":{"status":304,"body":{{body}}}}');
    });

    describe('Dot Notation', () => {
        const template = `
        {
            "zero": {{resource}},
            "one": {{resource.first}},
            "two": {{resource.first.second}},
            "array": {{array.1.0}}
        }
        `;

        it('should return nested properties', () => {
            const context = {
                resource: {
                    first: {
                        second: 'r',
                    },
                },
                other: {
                    first: {
                        second: 'o',
                    },
                },
                array: [
                    false,
                    [true],
                ],
            };
            const payload = WebhookPayloadTemplate.parse(template, null, context);
            expect(payload).toEqual({
                zero: {
                    first: {
                        second: 'r',
                    },
                },
                one: {
                    second: 'r',
                },
                two: 'r',
                array: true,
            });
        });

        it('should return null when nested props not available', () => {
            const context = {
                resource: {
                    foo: 'bar',
                },
                array: 'hello',
            };
            const payload = WebhookPayloadTemplate.parse(template, null, context);
            expect(payload).toEqual({
                zero: {
                    foo: 'bar',
                },
                one: null,
                two: null,
                array: null,
            });
        });
    });
});
