import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    isSensitiveKey,
    Log,
    LoggerJson,
    LoggerText,
    type LoggerOptions,
    REDACTED_PLACEHOLDER,
    redactString,
    sanitizeData,
} from '@apify/log';

const APIFY_TOKEN = `apify_api_${'a1B2'.repeat(9)}`;
const BEARER = 'SECRETbearer0123456789abcdef';
const PASSWORD = 'hunter2-not-a-real-password';
const QUERY_SECRET = 'SECRETinQUERY123';
const JWT = `eyJ${'hbGciOiJIUzI1NiJ9'}.eyJ${'zdWIiOiIxMjM0NTY3ODkwIn0'}.${'s'.repeat(43)}`;

const SECRETS = [APIFY_TOKEN, BEARER, PASSWORD, QUERY_SECRET, JWT];

const expectNoSecrets = (line: string) => SECRETS.forEach((secret) => expect(line).not.toContain(secret));

/** Mimics the shape of an AxiosError without depending on axios. */
const makeAxiosError = (cause?: unknown) => {
    const config = {
        method: 'post',
        baseURL: 'https://api.example.com',
        url: `/items/list?token=${QUERY_SECRET}`,
        headers: { Authorization: `Bearer ${BEARER}`, 'Content-Type': 'application/json' },
        auth: { username: 'api-user', password: PASSWORD },
        data: JSON.stringify({ password: PASSWORD }),
    };
    return Object.assign(new Error('Request failed with status code 503', { cause }), {
        name: 'AxiosError',
        isAxiosError: true,
        code: 'ERR_BAD_RESPONSE',
        details: { requestId: 'req1' },
        config,
        request: { _header: `POST /items HTTP/1.1\r\nAuthorization: Bearer ${BEARER}\r\n` },
        response: {
            status: 503,
            statusText: 'Service Unavailable',
            config,
            request: { _header: `Authorization: Bearer ${BEARER}` },
            headers: { 'content-type': 'application/json', 'set-cookie': [`sid=${PASSWORD}`] },
            data: { error: 'Service is unavailable', password: PASSWORD },
        },
    });
};

describe('log secret redaction', () => {
    let lines: string[];

    beforeEach(() => {
        lines = [];
        (['log', 'warn', 'error', 'debug'] as const).forEach((method) => {
            vi.spyOn(console, method).mockImplementation((line: string) => {
                lines.push(stripAnsi(line));
            });
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const jsonLog = (options: Partial<LoggerOptions> = {}) =>
        new Log({ logger: new LoggerJson({ skipTime: true }), ...options });
    const lastRecord = () => JSON.parse(lines.at(-1)!);

    describe('Axios errors', () => {
        it('loses the request config but keeps the response and custom fields', () => {
            jsonLog().exception(makeAxiosError(), 'API call failed', { groupId: 'g1' });

            expectNoSecrets(lines[0]);
            expect(lines[0]).not.toContain('Authorization');
            const { exception, groupId } = lastRecord();
            expect(groupId).toBe('g1');
            expect(exception).toMatchObject({
                name: 'AxiosError',
                message: 'Request failed with status code 503',
                code: 'ERR_BAD_RESPONSE',
                details: { requestId: 'req1' },
                method: 'post',
                url: '/items/list',
                baseURL: 'https://api.example.com',
                response: {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'content-type': 'application/json', 'set-cookie': [REDACTED_PLACEHOLDER] },
                    data: { error: 'Service is unavailable', password: REDACTED_PLACEHOLDER },
                },
            });
            expect(exception.stack).toContain('Request failed with status code 503');
            expect(Object.keys(exception)).not.toEqual(expect.arrayContaining(['config', 'request', 'isAxiosError']));
            expect(Object.keys(exception.response).sort()).toEqual(['data', 'headers', 'status', 'statusText']);
        });

        it('is reduced when passed in data or nested as a cause', () => {
            const log = jsonLog();
            log.softFail('Lookup failed', { err: makeAxiosError() });
            log.exception(new Error('network error', { cause: makeAxiosError() }), 'Cannot update');
            log.error('Unexpected error', { original: { error: makeAxiosError(makeAxiosError()) } });

            lines.forEach(expectNoSecrets);
            expect(JSON.parse(lines[0]).err.response.status).toBe(503);
            expect(JSON.parse(lines[1]).exception.cause.url).toBe('/items/list');
        });

        it('does not read properties of objects that are not errors', () => {
            const strict = new Proxy(
                { id: 'abc' },
                {
                    get: (target, key) => {
                        if (!(key in target)) throw new Error(`unknown prop ${String(key)}`);
                        return Reflect.get(target, key);
                    },
                },
            );

            expect(() => jsonLog().info('Strict object', { strict })).not.toThrow();
            expect(lastRecord().strict).toEqual({ id: 'abc' });
        });

        it('is reduced by the text logger too', () => {
            new Log({ logger: new LoggerText() }).exception(makeAxiosError(), 'Call failed', { err: makeAxiosError() });

            expectNoSecrets(lines[0]);
            expect(lines[0]).toContain('Request failed with status code 503');
        });
    });

    describe('fields with a sensitive name', () => {
        it('redacts their string values at any depth', () => {
            jsonLog().info('Request', {
                password: PASSWORD,
                apiToken: APIFY_TOKEN,
                refresh_token: PASSWORD,
                query: { accessToken: PASSWORD, secret: PASSWORD, resetToken: PASSWORD, limit: '10' },
                user: { id: 'u1', token: PASSWORD, tokenHash: PASSWORD },
                headers: { Authorization: BEARER, cookie: PASSWORD, 'set-cookie': [PASSWORD], 'X-Api-Key': PASSWORD },
                payment: { cardToken: PASSWORD, id_token: JWT },
                proxy: { auth: `user:${PASSWORD}`, apiKey: PASSWORD, privateKey: PASSWORD, credentials: PASSWORD },
            });

            expectNoSecrets(lines[0]);
            expect(lastRecord()).toMatchObject({
                password: REDACTED_PLACEHOLDER,
                query: { accessToken: REDACTED_PLACEHOLDER, limit: '10' },
                user: { id: 'u1', token: REDACTED_PLACEHOLDER },
                headers: { 'set-cookie': [REDACTED_PLACEHOLDER] },
            });
        });

        it('redacts every string inside an object or array under them', () => {
            jsonLog().info('Session', {
                cookies: [{ name: 'sid', value: PASSWORD, httpOnly: true, expires: 1795529568 }],
                token: { value: PASSWORD, nested: { raw: PASSWORD }, issuedAt: 1795529568 },
                credentials: { accessKeyId: 'AKIAEXAMPLE', secretAccessKey: PASSWORD },
            });

            expectNoSecrets(lines[0]);
            expect(lastRecord()).toMatchObject({
                cookies: [
                    { name: REDACTED_PLACEHOLDER, value: REDACTED_PLACEHOLDER, httpOnly: true, expires: 1795529568 },
                ],
                token: { value: REDACTED_PLACEHOLDER, nested: { raw: REDACTED_PLACEHOLDER }, issuedAt: 1795529568 },
                credentials: { accessKeyId: REDACTED_PLACEHOLDER, secretAccessKey: REDACTED_PLACEHOLDER },
            });
        });

        it('keeps values that are masked already', () => {
            const data = { q: { secret: '***', token: '[HIDDEN]' }, url: '/items?token=[HIDDEN]&api_key=***' };
            jsonLog().info('API', data);

            expect(lastRecord()).toMatchObject(data);
        });

        it('keeps non-string values, empty strings and the other fields of nested objects', () => {
            const data = {
                maxTokens: 4096,
                hasPassword: true,
                token: '',
                secret: null,
                auth: { username: 'user', password: PASSWORD },
                author: 'Jane',
                key: 'INPUT',
            };
            jsonLog().info('Usage', data);

            expect(lastRecord()).toEqual({
                level: 'INFO',
                msg: 'Usage',
                ...data,
                auth: { username: 'user', password: REDACTED_PLACEHOLDER },
            });
        });

        it.each([
            'password',
            'proxyPassword',
            'passwd',
            'MYSQL_PWD',
            'passphrase',
            'client_secret',
            'api-key',
            'API_KEY',
            'encryptionKey',
            'connectionString',
            'Proxy-Authorization',
            'bearer',
            'refreshToken',
            'passwordValid',
        ])('recognizes %s', (key) => expect(isSensitiveKey(key)).toBe(true));

        it.each([
            'key',
            'author',
            'authType',
            'userId',
            'url',
            'message',
            Symbol('token'),
            'tokenId',
            'token_ids',
            'tokenUrl',
            'token_type',
            'secretName',
            'apiKeyId',
            'signatureVersion',
            'tokenCount',
            'nextPageToken',
            'continuation_token',
        ])('does not recognize %s', (key) => expect(isSensitiveKey(key)).toBe(false));
    });

    describe('secrets recognized by format', () => {
        it.each([
            [`token ${APIFY_TOKEN} is invalid`, `token apify_api_${REDACTED_PLACEHOLDER} is invalid`],
            [`token apify_some_kind_${'a1B2'.repeat(9)}`, `token apify_some_kind_${REDACTED_PLACEHOLDER}`],
            [`args ["items","apify_api_${'a1B2'.repeat(9)}"]`, `args ["items","apify_api_${REDACTED_PLACEHOLDER}"]`],
            [`integration_api_token_${'a1B2'.repeat(9)}`, `integration_api_token_${REDACTED_PLACEHOLDER}`],
            [`Authorization: Bearer ${BEARER}`, `Authorization: Bearer ${REDACTED_PLACEHOLDER}`],
            ['authorization: basic dXNlcjpwYXNzMTIz', `authorization: basic ${REDACTED_PLACEHOLDER}`],
            [`id_token ${JWT} has wrong audience`, `id_token ${REDACTED_PLACEHOLDER} has wrong audience`],
            [
                `http://groups-RESIDENTIAL:${PASSWORD}@proxy.apify.com:8000`,
                `http://groups-RESIDENTIAL:${REDACTED_PLACEHOLDER}@proxy.apify.com:8000`,
            ],
            [
                `/v2/logs/abc?token=${QUERY_SECRET}&download=true#top`,
                `/v2/logs/abc?token=${REDACTED_PLACEHOLDER}&download=true#top`,
            ],
            [
                `/v2/datasets/abc/items%3Ftoken=${QUERY_SECRET}/`,
                `/v2/datasets/abc/items%3Ftoken=${REDACTED_PLACEHOLDER}`,
            ],
            [
                `/confirm?a=1&confirmToken=${QUERY_SECRET}&amp;signature=${QUERY_SECRET}`,
                `/confirm?a=1&confirmToken=${REDACTED_PLACEHOLDER}&amp;signature=${REDACTED_PLACEHOLDER}`,
            ],
            [
                `/items?tokenCount=5&secret=${QUERY_SECRET}&nextPageToken=abc`,
                `/items?tokenCount=5&secret=${REDACTED_PLACEHOLDER}&nextPageToken=abc`,
            ],
            [`/webhook?secret=${QUERY_SECRET}`, `/webhook?secret=${REDACTED_PLACEHOLDER}`],
        ])('redacts %s', (text, expected) => {
            expect(redactString(text)).toBe(expected);
        });

        it.each([
            'Actor run finished',
            'Basic authentication is required, see the Bearer token docs',
            'GET https://api.apify.com/v2/acts/apify~web-scraper/runs?limit=10&offset=20&status=SUCCEEDED',
            'https://example.com:8080/path@1.2.3/file.js',
            'apify_proxy_groups and apify_api_client_version',
            'Error: ENOENT at Object.openSync (node:fs:603:3)',
        ])('keeps %s', (text) => {
            expect(redactString(text)).toBe(text);
        });

        it('redacts the message, the data strings, the exception and the default data', () => {
            const exception = new Error(`Token ${APIFY_TOKEN} was rejected`);
            const log = jsonLog({ data: { proxyUrl: `http://auto:${PASSWORD}@proxy.apify.com:8000` } });
            log.exception(exception, `Request to /v2/acts?token=${QUERY_SECRET} failed`, {
                urls: [`https://api.apify.com/v2/users/me?token=${QUERY_SECRET}`],
                header: `Bearer ${BEARER}`,
            });

            expectNoSecrets(lines[0]);
            expect(lastRecord().msg).toBe(`Request to /v2/acts?token=${REDACTED_PLACEHOLDER} failed`);
            expect(lastRecord().exception.message).toBe(`Token apify_api_${REDACTED_PLACEHOLDER} was rejected`);
        });

        it('redacts a secret that is cut by the truncation', () => {
            const text = `${'x'.repeat(95)} ${APIFY_TOKEN}`;
            // The limit falls inside the token: without reading past it, the first 14 characters would stay
            const sanitized = sanitizeData({ text }, { maxStringLength: 110, redactSecrets: true });

            expect(sanitized).toEqual({ text: `${'x'.repeat(95)} apify_api_${REDACTED_PLACEHOLDER}` });
            expect(sanitizeData({ text }, { maxStringLength: 100, redactSecrets: true })).toEqual({
                text: `${'x'.repeat(86)}...[truncated]`,
            });
        });

        it('stays fast on long hostile strings', () => {
            const hostile = [
                'apify_'.repeat(40_000),
                'Bearer '.repeat(30_000),
                `http://${'a:'.repeat(100_000)}`,
                '&a='.repeat(70_000),
                `eyJ${'a'.repeat(200_000)}`,
                `://${'a'.repeat(200_000)}`,
                'a.'.repeat(100_000),
                'https://a.b/c '.repeat(15_000),
                `?${'token'.repeat(40_000)}`,
            ];
            const startedAt = performance.now();
            hostile.forEach((text) => redactString(text));

            expect(performance.now() - startedAt).toBeLessThan(1000);
        });
    });

    describe('option redactSecrets', () => {
        it('leaves lines without a secret untouched', () => {
            const args = [
                'Actor run finished',
                { runId: 'abc', stats: { durationMillis: 12, urls: ['https://example.com/?page=2'] } },
            ] as const;
            jsonLog().info(...args);
            jsonLog({ redactSecrets: false }).info(...args);

            expect(lines[0]).toBe(lines[1]);
        });

        it('can be turned off and is inherited by child loggers', () => {
            const log = jsonLog({ redactSecrets: false });
            log.info(`Token ${APIFY_TOKEN}`, { password: PASSWORD, err: makeAxiosError() });
            log.child({ prefix: 'Child' }).info('Child', { password: PASSWORD });
            jsonLog().child({ prefix: 'Child' }).info('Child', { password: PASSWORD });

            expect(lines[0]).toContain(APIFY_TOKEN);
            expect(lines[0]).toContain(BEARER);
            expect(lines[1]).toContain(PASSWORD);
            expect(lines[2]).not.toContain(PASSWORD);
        });

        it('is kept when set to undefined', () => {
            const on = jsonLog();
            on.setOptions({ redactSecrets: undefined });
            on.info('On', { password: PASSWORD });
            jsonLog({ redactSecrets: undefined }).info('On', { password: PASSWORD });
            const off = jsonLog({ redactSecrets: false });
            off.setOptions({ redactSecrets: undefined });
            off.child({ redactSecrets: undefined }).info('Off', { password: PASSWORD });

            expect(lines[0]).not.toContain(PASSWORD);
            expect(lines[1]).not.toContain(PASSWORD);
            expect(lines[2]).toContain(PASSWORD);
        });

        it('is off in sanitizeData() unless asked for', () => {
            expect(sanitizeData({ password: PASSWORD }, {})).toEqual({ password: PASSWORD });
        });

        it('must be a boolean', () => {
            expect(() => new Log({ redactSecrets: 'yes' as unknown as boolean })).toThrow('redactSecrets');
        });
    });
});
