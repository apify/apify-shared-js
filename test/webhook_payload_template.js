import { expect } from 'chai';
import WebhookPayloadTemplate from '../build/webhook_payload_template';

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
        expect(payload).to.be.eql({
            id: 'some-id',
            createdAt: '2019-05-08T15:22:21.095Z',
            dataToSend: '{{data}}',
        });
    });
    it('should parse template with variables', () => {
        const payload = WebhookPayloadTemplate.parse(validTemplate);
        expect(payload).to.be.eql({
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
        expect(payload).to.be.eql({
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
    it('should throw on invalid json', () => {
        try {
            WebhookPayloadTemplate.parse(invalidJson);
            throw new Error('Wrong error.');
        } catch (err) {
            expect(err.message).to.be.eql('Unexpected token , in JSON at position 68');
        }
    });
    it('should throw on invalid variable', () => {
        const allowedVars = new Set(['userId', 'eventData']);
        try {
            WebhookPayloadTemplate.parse(validTemplate, allowedVars);
            throw new Error('Wrong error.');
        } catch (err) {
            expect(err.message).to.be.eql('Invalid payload template variable: eventType');
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
        expect(payloadTemplate).to.be.eql('{"hello":"world","num":{{num}},"data":{"status":304,"body":{{body}}}}');
    });
});
