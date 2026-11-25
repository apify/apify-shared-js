import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Log, LoggerJson, LoggerText, type LoggerOptions, sanitizeData } from '@apify/log';

const APIFY_TOKEN = `apify_api_${'a1B2'.repeat(9)}`;
const BEARER = 'SECRETbearer0123456789abcdef';
const PASSWORD = 'hunter2-not-a-real-password';
const QUERY_SECRET = 'SECRETinQUERY123';
const JWT = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.${'s'.repeat(43)}`;
const SECRETS = [APIFY_TOKEN, BEARER, PASSWORD, QUERY_SECRET, JWT];

const redact = (data: unknown) => sanitizeData(data, { redactSecrets: true });

/** Mimics the shape of an AxiosError without depending on axios. */
const makeAxiosError = () => {
    const config = {
        method: 'post',
        baseURL: 'https://api.example.com',
        url: `/items/list?key=${QUERY_SECRET}`,
        headers: { Authorization: `Bearer ${BEARER}` },
        data: JSON.stringify({ pin: PASSWORD }),
    };
    return Object.assign(new Error('Request failed with status code 503'), {
        isAxiosError: true,
        code: 'ERR_BAD_RESPONSE',
        config,
        request: { _header: `Authorization: Bearer ${BEARER}` },
        response: {
            status: 503,
            statusText: 'Service Unavailable',
            config,
            request: { _header: `Authorization: Bearer ${BEARER}` },
            headers: { 'set-cookie': [`sid=${PASSWORD}`] },
            data: { error: 'Service is unavailable' },
        },
    });
};

describe('log secret redaction', () => {
    let lines: string[];

    beforeEach(() => {
        lines = [];
        (['log', 'warn', 'error', 'debug'] as const).forEach((method) => {
            vi.spyOn(console, method).mockImplementation((line: string) => lines.push(stripAnsi(line)));
        });
    });

    afterEach(() => vi.restoreAllMocks());

    const jsonLog = (options: Partial<LoggerOptions> = {}) =>
        new Log({ logger: new LoggerJson({ skipTime: true }), ...options });
    const expectNoSecrets = () =>
        lines.forEach((line) => SECRETS.forEach((secret) => expect(line).not.toContain(secret)));

    it('drops the request of an Axios error and keeps its response', () => {
        const log = jsonLog();
        log.exception(makeAxiosError(), 'API call failed');
        log.softFail('Lookup failed', { err: new Error('network error', { cause: makeAxiosError() }) });
        new Log({ logger: new LoggerText() }).exception(makeAxiosError(), 'Call failed', { err: makeAxiosError() });

        expectNoSecrets();
        const { exception } = JSON.parse(lines[0]);
        expect(exception).toMatchObject({
            message: 'Request failed with status code 503',
            code: 'ERR_BAD_RESPONSE',
            method: 'post',
            url: '/items/list',
            baseURL: 'https://api.example.com',
            response: { status: 503, headers: { 'set-cookie': ['***'] }, data: { error: 'Service is unavailable' } },
        });
        expect(Object.keys(exception)).not.toEqual(expect.arrayContaining(['config', 'request']));
        expect(Object.keys(exception.response).sort()).toEqual(['data', 'headers', 'status', 'statusText']);
        expect(JSON.parse(lines[1]).err.cause.url).toBe('/items/list');
    });

    it('masks every string under a field with a sensitive name', () => {
        const data = {
            password: PASSWORD,
            query: { accessToken: PASSWORD, limit: '10' },
            headers: { Authorization: BEARER, 'set-cookie': [PASSWORD], 'X-Api-Key': PASSWORD },
            cookies: [{ name: 'sid', value: PASSWORD, httpOnly: true }],
            token: { nested: { raw: PASSWORD }, issuedAt: 1795529568 },
        };

        expect(redact(data)).toEqual({
            password: '***',
            query: { accessToken: '***', limit: '10' },
            headers: { Authorization: '***', 'set-cookie': ['***'], 'X-Api-Key': '***' },
            cookies: [{ name: '***', value: '***', httpOnly: true }],
            token: { nested: { raw: '***' }, issuedAt: 1795529568 },
        });
    });

    it('keeps non-string and empty values under a sensitive name', () => {
        const data = { maxTokens: 4096, hasPassword: true, token: '', secret: null };

        expect(redact(data)).toEqual(data);
    });

    it.each([
        ...['password', 'proxyPassword', 'passwd', 'MYSQL_PWD', 'passphrase', 'client_secret', 'refreshToken'],
        ...['api-key', 'API_KEY', 'encryptionKey', 'privateKey', 'connectionString', 'Proxy-Authorization'],
        ...['bearer', 'cookie', 'credentials', 'signature', 'auth'],
    ])('treats the field %s as sensitive', (key) => expect(redact({ [key]: 'x' })).toEqual({ [key]: '***' }));

    it.each(['key', 'author', 'authType', 'userId', 'url', 'message', Symbol('token')])(
        'does not treat the field %s as sensitive',
        (key) => expect(redact({ [key]: 'x' })).toEqual({ [key]: 'x' }),
    );

    it.each([
        [`token ${APIFY_TOKEN} is invalid`, 'token apify_api_*** is invalid'],
        [`["items","apify_some_kind_${'a1B2'.repeat(9)}"]`, '["items","apify_some_kind_***"]'],
        [`integration_api_token_${'a1B2'.repeat(9)}`, 'integration_api_token_***'],
        [`Authorization: Bearer ${BEARER}`, 'Authorization: Bearer ***'],
        ['authorization: basic dXNlcjpwYXNzMTIz', 'authorization: basic ***'],
        [`id_token ${JWT} has wrong audience`, 'id_token *** has wrong audience'],
        [
            `http://groups-RESIDENTIAL:${PASSWORD}@proxy.apify.com:8000`,
            'http://groups-RESIDENTIAL:***@proxy.apify.com:8000',
        ],
        [`/v2/logs/abc?token=${QUERY_SECRET}&download=true#top`, '/v2/logs/abc?token=***&download=true#top'],
        [`/v2/datasets/abc/items%3Ftoken=${QUERY_SECRET}/`, '/v2/datasets/abc/items%3Ftoken=***'],
        [
            `/confirm?a=1&confirmToken=${QUERY_SECRET}&amp;signature=${QUERY_SECRET}`,
            '/confirm?a=1&confirmToken=***&amp;signature=***',
        ],
    ])('masks the secret in %s', (text, expected) => expect(redact(text)).toBe(expected));

    it.each([
        'Actor run finished',
        'Basic authentication is required, see the Bearer token docs',
        'GET https://api.apify.com/v2/acts/apify~web-scraper/runs?limit=10&offset=20&status=SUCCEEDED',
        'https://example.com:8080/path@1.2.3/file.js',
        'apify_proxy_groups and apify_api_client_version',
    ])('keeps %s', (text) => expect(redact(text)).toBe(text));

    it('masks the message, the exception and the default data', () => {
        const log = jsonLog({ data: { proxyUrl: `http://auto:${PASSWORD}@proxy.apify.com:8000` } });
        log.exception(
            new Error(`Token ${APIFY_TOKEN} was rejected`),
            `Request to /v2/acts?token=${QUERY_SECRET} failed`,
        );

        expectNoSecrets();
        expect(JSON.parse(lines[0])).toMatchObject({
            msg: 'Request to /v2/acts?token=*** failed',
            exception: { message: 'Token apify_api_*** was rejected' },
        });
    });

    it('masks a secret that is cut by the truncation', () => {
        const text = `${'x'.repeat(95)} ${APIFY_TOKEN}`;

        // The limit falls inside the token: without reading past it, the first 14 characters would stay
        expect(sanitizeData(text, { maxStringLength: 110, redactSecrets: true })).toBe(
            `${'x'.repeat(95)} apify_api_***`,
        );
        expect(sanitizeData(text, { maxStringLength: 100, redactSecrets: true })).toBe(
            `${'x'.repeat(86)}...[truncated]`,
        );
    });

    it('stays fast on long hostile strings', () => {
        const hostile = [
            ...['apify_', 'Bearer ', 'a:', '&a=', 'a.', 'https://a.b/c ', '?token', '://a'].map((part) =>
                part.repeat(40_000),
            ),
            `eyJ${'a'.repeat(200_000)}`,
        ];
        const startedAt = performance.now();
        hostile.forEach((text) => sanitizeData(text, { redactSecrets: true }));

        expect(performance.now() - startedAt).toBeLessThan(1000);
    });

    it('is on by default, also in child loggers and when set to undefined', () => {
        const log = jsonLog();
        log.setOptions({ redactSecrets: undefined });
        log.info(APIFY_TOKEN, { password: PASSWORD });
        log.child({ prefix: 'Child' }).info(APIFY_TOKEN, { password: PASSWORD });

        expectNoSecrets();
    });

    it('can be turned off and is off in sanitizeData() unless asked for', () => {
        const log = jsonLog({ redactSecrets: false });
        log.info(APIFY_TOKEN, { password: PASSWORD });
        log.child({ prefix: 'Child' }).info(APIFY_TOKEN, { password: PASSWORD });

        lines.forEach((line) => expect(line).toContain(APIFY_TOKEN));
        lines.forEach((line) => expect(line).toContain(PASSWORD));
        expect(sanitizeData({ password: PASSWORD }, {})).toEqual({ password: PASSWORD });
    });

    it('leaves a line without a secret untouched', () => {
        const args = ['Actor run finished', { runId: 'abc', urls: ['https://example.com/?page=2'] }] as const;
        jsonLog().info(...args);
        jsonLog({ redactSecrets: false }).info(...args);

        expect(lines[0]).toBe(lines[1]);
    });
});
