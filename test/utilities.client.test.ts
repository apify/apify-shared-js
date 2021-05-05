import _ from 'underscore';
import Ajv from 'ajv';

// @ts-ignore This clone doesn't work for array of NULLs (returns an empty array).
import brokenClone from 'clone';

import {
    buildOrVersionNumberIntToStr,
    escapeForBson,
    getOrdinalSuffix,
    isBadForMongo,
    jsonStringifyExtended,
    JsonVariable,
    normalizeUrl,
    splitFullName,
    traverseObject,
    unescapeFromBson,
    validateInputUsingValidator,
} from '@apify/utilities';

const clone = function (obj: any) {
    return Array.isArray(obj) ? obj.slice(0) : brokenClone(obj);
};

const GOOD_OBJECTS = [
    {},
    null,
    undefined,
    123.456,
    'something',
    Buffer.from('some-string'),
    new Date(),
    [],
    {
        prop: 124,
    },
    [
        {
            gggg: 1234,
        },
        {
            hhhh: 'gggg',
        },
    ],
    {
        prop1: 124,
        prop2: 'str',
        prop3: { prop4: null },
        prop4: [1, 2, 3, 4, 5],
    },
    ['aaa', 1, 3, null, { prop: 'yolo' }, {}],
    new Array(10000),
    {
        prop1: '$anything',
        prop2: 'xxx.yyyy.zzzz',
        prop3: 'xxx\0yyyy',
        prop4: 'toBSON',
        prop5: '_bsontype',
    },
    {
        dollar$not_in_front: new Date(),
        'one more $id': new Date(),
    },
    {
        'not_in_front@toBSON': null,
    },
    {
        'not_in_front@_bsontype': null,
    },
    {
        // to test the bson-ext bug https://github.com/christkv/bson-ext/issues/37
        entries: 12345,
    },
    {
        some: { deep: { object: { structure: { one: { more: [1, 2, 4, 5] } } } } },
    },
];

const BAD_REVERSIBLE_OBJECTS = [
    {
        'xxx.yyy.zzz': 123,
    },
    {
        $id: null,
    },
    {
        $: null,
    },
    {
        toBSON() {
        },
    },
    {
        toBSON: 'some text',
    },
    {
        _bsontype: 'whatever',
    },
    {
        prop1: {
            prop2: {
                prop3: {
                    $test: 123,
                },
            },
        },
    },
    {
        // undefined values are also considered
        $xxx: undefined,
        'xxx.yyy.zzz': undefined,
        toBSON: undefined,
        _bsontype: undefined,
    },
];

// these contain null chars and cannot be reversed
const BAD_IRREVERSIBLE_OBJECTS = [
    {
        xxx: {
            'null\0': 'I want to go home',
        },
    },
    {
        '\0': 'only null',
    },
    {
        'in the \0 middle': null,
    },
    {
        // undefined values are also considered
        $xxx: undefined,
        'xxx.yyy.zzz': undefined,
        toBSON: undefined,
        _bsontype: undefined,
        '\0': undefined,
    },
] as any;

const BAD_OBJECTS = _.union(BAD_REVERSIBLE_OBJECTS, BAD_IRREVERSIBLE_OBJECTS);

// this effectively tests _escapePropertyName() and _unescapePropertyName()
const KNOWN_ESCAPES = [
    {
        src: { $test: 1 },
        trg: { '\uFF04test': 1 },
    },
    {
        src: { $test$: 1 },
        trg: { '\uFF04test$': 1 },
    },
    {
        src: { 'x\uFF04': 1 },
        trg: { 'x\uFF04': 1 },
    },
    {
        src: { 'aaa.bbb': undefined },
        trg: { 'aaa\uFF0Ebbb': undefined },
    },
    {
        src: { '$aaa.bbb.ccc': undefined },
        trg: { '\uFF04aaa\uFF0Ebbb\uFF0Eccc': undefined },
    },
    {
        src: { '.xxx..': undefined },
        trg: { '\uFF0Exxx\uFF0E\uFF0E': undefined },
    },
    {
        src: { toBSON: null },
        trg: { ｔｏＢＳＯＮ: null },
    },
    {
        src: { xｔｏＢＳＯＮ: [] },
        trg: { xｔｏＢＳＯＮ: [] },
    },
    {
        src: { _bsontype: null },
        trg: { '\uFF3F\uFF42\uFF53\uFF4F\uFF4E\uFF54\uFF59\uFF50\uFF45': null },
    },
    {
        src: { x＿ｂｓｏｎｔｙｐｅ: [1, 2, 10] },
        trg: { x＿ｂｓｏｎｔｙｐｅ: [1, 2, 10] },
    },
    {
        src: { ' $toBSON': null },
        trg: { ' $toBSON': null },
    },
    {
        src: { ' $_bsontype': null },
        trg: { ' $_bsontype': null },
    },
    {
        irreversible: true,
        src: { 'xxx\0yyy': null },
        trg: { xxxyyy: null },
    },
    {
        irreversible: true,
        src: { '\0xxx\0yyy\0\0': null },
        trg: { xxxyyy: null },
    },
    {
        src: { aaa: { bbb: { ccc: 'nothing wrong with one' } } },
        trg: { aaa: { bbb: { ccc: 'nothing wrong with one' } } },
    },
];

const testIsBadForMongo = function (obj: any, expectedResult: any) {
    // ensure the function doesn't change the object!!!
    const objClone = clone(obj);
    expect(isBadForMongo(obj)).toEqual(expectedResult);
    expect(obj).toEqual(objClone);
};

// tests escapeForBson() or unescapeFromBson() function whether it converts objects as expected
const testEscape = function (escapeFunc: any, src: any, trg: any) {
    // don't change input parameters!

    // console.dir(src);
    // console.dir(trg);
    // console.log();

    const srcClone = clone(src);
    const trgClone = escapeFunc(srcClone, true);

    const isObject = function (obj: any) {
        return typeof obj === 'object';
    };
    const isDate = function (obj: any) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    };
    const isDateOrBuffer = (obj: any) => isDate(obj) || Buffer.isBuffer(obj);

    // ensure srcClone didn't change
    if (
        (srcClone && isObject(srcClone) && !isDateOrBuffer(srcClone))
        || (trgClone && isObject(trgClone) && !isDateOrBuffer(trgClone))
    ) {
        expect(srcClone).not.toBe(trgClone);
    }
    expect(srcClone).toEqual(src);

    const trgNoClone = escapeFunc(srcClone, false);

    expect(srcClone).toEqual(trgNoClone);
    expect(srcClone).toEqual(trgClone);
    expect(trgClone).toEqual(trg);
};

describe('utilities.client', () => {
    describe('#traverseObject()', () => {
        it('works with identity', () => {
            const identity = <T>(key: string, value: T): [string, T] => [key, value];

            const obj = {
                something: 123,
                array: [1, 2, 3],
                date1At: new Date(1000),
                subObject: {
                    date2At: new Date(2000),
                    test: 'test',
                    anotherSub: {
                        date3At: new Date(2000),
                    },
                },
            };
            const clonedObj = clone(obj);

            {
                const returnedObject = traverseObject(obj, false, identity);
                expect(returnedObject).toEqual(clonedObj);
                expect(returnedObject).toEqual(obj);
            }

            {
                const returnedObject = traverseObject(obj, true, identity);
                expect(returnedObject).toEqual(clonedObj);
                expect(returnedObject).not.toBe(obj);
            }
        });

        it('works with transformation', () => {
            const incrementDates = <T>(key: string, value: T): [string, T] => {
                if (key.endsWith('At') && _.isDate(value)) {
                    return [key, new Date(value.getTime() + 1) as unknown as T];
                }
                return [key, value];
            };

            const origObj = {
                something: 123,
                array: [1, 2, 3],
                date1At: new Date(1000),
                subObject: {
                    date2At: new Date(2000),
                    test: 'test',
                    anotherSub: {
                        date3At: new Date(3000),
                    },
                },
            };
            const clonedOrigObj = clone(origObj);
            const clonedObj = clone(origObj);

            {
                const returnedObject = traverseObject(clonedObj, false, incrementDates);
                expect(returnedObject).toEqual({
                    something: 123,
                    array: [1, 2, 3],
                    date1At: new Date(1001),
                    subObject: {
                        date2At: new Date(2001),
                        test: 'test',
                        anotherSub: {
                            date3At: new Date(3001),
                        },
                    },
                });
                expect(returnedObject).toEqual(clonedObj);
            }

            {
                const returnedObject = traverseObject(origObj, true, incrementDates);
                expect(returnedObject).toEqual({
                    something: 123,
                    array: [1, 2, 3],
                    date1At: new Date(1001),
                    subObject: {
                        date2At: new Date(2001),
                        test: 'test',
                        anotherSub: {
                            date3At: new Date(3001),
                        },
                    },
                });
                expect(returnedObject).not.toEqual(origObj);
                expect(origObj).toEqual(clonedOrigObj);
            }
        });
    });

    describe('#isBadForMongo()', () => {
        it('works with good objects', () => {
            GOOD_OBJECTS.forEach((obj) => {
                testIsBadForMongo(obj, false);
            });

            testIsBadForMongo(GOOD_OBJECTS, false);
        });

        it('works with bad objects', () => {
            BAD_OBJECTS.forEach((obj) => {
                // console.dir(obj);
                testIsBadForMongo(obj, true);
            });

            testIsBadForMongo(BAD_OBJECTS, true);
        });
    });

    describe('#escapeForBson()', () => {
        it('works as expected on pre-defined records', () => {
            KNOWN_ESCAPES.forEach((rec) => {
                testEscape(escapeForBson, rec.src, rec.trg);
            });
        });

        it('leaves good objects unchanged', () => {
            GOOD_OBJECTS.forEach((obj) => {
                testEscape(escapeForBson, obj, obj);
            });
        });

        it('works together with unescapeFromBson()', () => {
            BAD_REVERSIBLE_OBJECTS.forEach((obj) => {
                const escaped = escapeForBson(obj, true);
                const unescaped = unescapeFromBson(escaped, true);

                expect(unescaped).toEqual(obj);

                testEscape(escapeForBson, obj, escaped);
                testEscape(unescapeFromBson, escaped, obj);
            });
        });
    });

    describe('#unescapeFromBson()', () => {
        it('works as expected on pre-defined records', () => {
            KNOWN_ESCAPES.forEach((rec) => {
                if (!rec.irreversible) testEscape(unescapeFromBson, rec.trg, rec.src);
            });
        });

        it('leaves both good and bad objects unchanged', () => {
            GOOD_OBJECTS.forEach((obj) => {
                testEscape(escapeForBson, obj, obj);
            });
            BAD_OBJECTS.forEach((obj) => {
                testEscape(unescapeFromBson, obj, obj);
            });
        });
    });

    describe('#getOrdinalSuffix()', () => {
        it('works as expected', () => {
            const dir = {
                1: 'st',
                2: 'nd',
                3: 'rd',
                21: 'st',
                22: 'nd',
                23: 'rd',
                31: 'st',
                32: 'nd',
                33: 'rd',
                41: 'st',
                42: 'nd',
                43: 'rd',
                51: 'st',
                52: 'nd',
                53: 'rd',
                61: 'st',
                62: 'nd',
                63: 'rd',
                71: 'st',
                72: 'nd',
                73: 'rd',
                81: 'st',
                82: 'nd',
                83: 'rd',
                91: 'st',
                92: 'nd',
                93: 'rd',
                101: 'st',
                102: 'nd',
                103: 'rd',
            };

            for (let i = -100; i < 120; i++) {
                const expected = dir[i] || 'th';
                expect(getOrdinalSuffix(i)).toEqual(expected);
            }
        });
    });

    describe('#normalizeUrl', () => {
        it('should return null for invalid URLs', () => {
            expect(normalizeUrl('example.com')).toEqual(null);
            expect(normalizeUrl('something')).toEqual(null);
            expect(normalizeUrl('     127.0.0.1   ')).toEqual(null);
            expect(normalizeUrl('http://')).toEqual(null);
            expect(normalizeUrl('   http://')).toEqual(null);
            expect(normalizeUrl('   http://     ')).toEqual(null);
            expect(normalizeUrl('')).toEqual(null);
            expect(normalizeUrl('    ')).toEqual(null);

            // @ts-expect-error
            expect(normalizeUrl()).toEqual(null);
            // @ts-expect-error
            expect(normalizeUrl(null)).toEqual(null);
            // @ts-expect-error
            expect(normalizeUrl(undefined)).toEqual(null);
            // @ts-expect-error
            expect(normalizeUrl({})).toEqual(null);
        });

        it('should persist protocols', () => {
            expect(normalizeUrl('http://example.com')).toEqual('http://example.com');

            expect(normalizeUrl('https://example.com')).toEqual('https://example.com');
        });

        it('should lowercase hostname and protocols', () => {
            expect(normalizeUrl('httpS://EXAMPLE.cOm')).toEqual('https://example.com');
            expect(normalizeUrl('hTTp://www.EXAMPLE.com')).toEqual('http://www.example.com');
            expect(normalizeUrl('SOMETHING://www.EXAMPLE.com/test')).toEqual('something://www.example.com/test');
        });

        it('should remove trailing slash', () => {
            expect(normalizeUrl('http://example.com')).toEqual('http://example.com');
            expect(normalizeUrl('ftp://example.com/')).toEqual('ftp://example.com');
            expect(normalizeUrl('anything://example.com/test/')).toEqual('anything://example.com/test');
            expect(normalizeUrl('http://example.com/test.html')).toEqual('http://example.com/test.html');
            expect(normalizeUrl('http://example.com/test.html/')).toEqual('http://example.com/test.html');
        });

        it('should remove ? when empty QSA', () => {
            expect(normalizeUrl('http://example.com/?')).toEqual('http://example.com');
            expect(normalizeUrl('http://example.com/something?')).toEqual('http://example.com/something');
        });

        it('should remove common tracking parameters', () => {
            expect(normalizeUrl('http://example.com/?utm_source=xyz')).toEqual('http://example.com');
            expect(normalizeUrl('http://example.com/?utm_campaign=xyz&param=val')).toEqual('http://example.com?param=val');
            expect(normalizeUrl('http://example.com/?utm_campaign=xyz&utm_source=neco')).toEqual('http://example.com');
        });

        it('should sort parameters alphabetically', () => {
            expect(normalizeUrl('http://example.com/?a=a&b=b&c=c')).toEqual('http://example.com?a=a&b=b&c=c');
            expect(normalizeUrl('http://example.com/?b=a&c=b&a=c')).toEqual('http://example.com?a=c&b=a&c=b');
        });

        it('should handle keepFragment parameter correctly', () => {
            expect(normalizeUrl('http://example.com#fragment', false)).toEqual('http://example.com');
            expect(normalizeUrl('http://example.com#', false)).toEqual('http://example.com');
            expect(normalizeUrl('http://example.com#fragment', true)).toEqual('http://example.com#fragment');
            expect(normalizeUrl('http://example.com#', true)).toEqual('http://example.com');
            expect(normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', true)).toEqual('https://www.example.com#keyB=val1&keyA=val2');
            expect(normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', false)).toEqual('https://www.example.com');
        });

        it('should not touch invalid or empty params', () => {
            expect(normalizeUrl('http://example.com/?neco=&dalsi')).toEqual('http://example.com?dalsi&neco=');
        });

        it('should normalize real-world URLs', () => {
            expect(normalizeUrl('https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt'
                + '?utm_source=heureka.cz'
                + '&utm_medium=cpc'
                + '&utm_campaign=Notebooky'
                + '&utm_term=Dell_XPS_15_9550_Touch_stribrna')).toEqual('https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt');

            const expected = 'http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580';
            expect(normalizeUrl('http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580/')).toEqual(expected);
        });

        it('should trim all parts of URL', () => {
            expect(normalizeUrl('    http    ://     test    # fragment   ')).toEqual('http://test');
            expect(normalizeUrl('    http   ://     test    # fragment   ', true)).toEqual('http://test#fragment');
        });
    });
    describe('#buildOrVersionNumberIntToStr()', () => {
        it('should convert build number to string', () => {
            expect(buildOrVersionNumberIntToStr(200000)).toEqual('0.2');
            expect(buildOrVersionNumberIntToStr(10200001)).toEqual('1.2.1');
        });
        it('should return null if string passed', () => {
            // @ts-expect-error
            expect(buildOrVersionNumberIntToStr('bla')).toEqual(null);
        });
    });

    describe('#validateInputUsingValidator()', () => {
        const baseInputSchema = {
            title: 'Testing input schema',
            type: 'object',
            schemaVersion: 1,
            properties: {},
            required: ['field'],
        };
        const ajv = new Ajv();
        const buildInputSchema = (properties: any) => {
            const inputSchema = { ...baseInputSchema, properties };
            const validator = ajv.compile(inputSchema);
            return { inputSchema, validator };
        };

        it('should validate required proxy', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'Required proxy validation',
                    description: 'Field for testing of a required proxy validation',
                },
            });

            const inputs = [
                // Invalid
                { field: null },
                { field: { useApifyProxy: false } },
                { field: { useApifyProxy: false, proxyUrls: [] } },
                // Valid
                { field: { useApifyProxy: true } },
            ];

            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).toEqual(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate string with regexp', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'string',
                    title: 'pattern validation',
                    description: 'Field for testing of a pattern validion',
                    pattern: '\\w+',
                    nullable: true,
                    minLength: 2,
                    maxLength: 5,
                },
            });
            const inputs = [
                // Invalid
                {}, // Fails required check
                { field: 'a' }, // Fails min length
                { field: 'abcdef' }, // Fails max length
                { field: '$$' }, // Fails pattern
                // Valid
                { field: null }, // Valid due to nullable true
                { field: 'aA0' }, // Valid pattern and length
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 4 invalid inputs
            expect(results.length).toEqual(4);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate request list sources array', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'array',
                    editor: 'requestListSources',
                    title: 'requestListSources url validation',
                    description: 'Field for testing of a requestListSources url validation',
                },
            });
            const inputs = [
                // Invalid
                { field: [{}] }, // Fails because URL is missing
                { field: [{ url: '' }] }, // Fails because URL is empty
                { field: [{ url: 'asdad' }] }, // Fails because URL is not valid
                { field: [{ url: 'http://example.com' }, {}] }, // Second item fails check
                { field: [{ requestsFromUrl: 'ftp://example.com' }, {}] }, // Fails requestsFromUrl check
                // Valid
                { field: [] },
                { field: [{ url: 'http://example.com' }] },
                { field: [{ requestsFromUrl: 'http://example.com' }] },
                { field: [{ url: 'http://example.com' }, { url: 'http://www.example.com' }] },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 5 invalid inputs
            expect(results.length).toEqual(5);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate key-value array with regexp', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'array',
                    editor: 'keyValue',
                    title: 'patternKey/patternValue validation',
                    description: 'Field for testing of a patternKey/patternValue validation',
                    patternKey: '\\w+',
                    patternValue: '\\w+',
                    minItems: 1,
                    maxItems: 2,
                    uniqueItems: true,
                    nullable: true,
                },
            });
            const inputs = [
                // Invalid
                {}, // Fails required check
                { field: [] }, // Fails minItems check
                { field: [{ key: '$', value: '' }] }, // Fails patternKey check
                { field: [{ key: '', value: '$' }] }, // Fails patternValue check
                { field: [{ key: 'aA0', value: 'aA0' }, { key: 'aA1', value: 'aA1' }, { key: 'aA2', value: 'aA2' }] }, // Fails maxItems check
                { field: [{ key: 'aA0', value: 'aB0' }, { value: 'aB0', key: 'aA0' }] }, // Fails uniqueItems check
                // Valid
                { field: null },
                { field: [{ key: 'aA0', value: 'aA0' }] },
                { field: [{ key: 'aA0', value: 'aA0' }, { key: 'aA1', value: 'aA1' }] },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 6 invalid inputs
            expect(results.length).toEqual(6);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate array list with regexp', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'array',
                    editor: 'stringList',
                    title: 'patternValue validation',
                    description: 'Field for testing of a patternValue validation',
                    patternValue: '\\w+',
                    minItems: 1,
                    maxItems: 2,
                    uniqueItems: true,
                    nullable: true,
                },
            });
            const inputs = [
                // Invalid
                {}, // Fails required check
                { field: [] }, // Fails minItems check
                { field: ['$'] }, // Fails patternValue check
                { field: ['aA0', 'aA1', 'aA2'] }, // Fails maxItems check
                { field: ['aA0', 'aA0'] }, // Fails uniqueItems check
                // Valid
                { field: null },
                { field: ['aA0'] },
                { field: ['aA0', 'aA1'] },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 5 invalid inputs
            expect(results.length).toEqual(5);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate object with regexp', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'json',
                    title: 'Object patternKey/patternValue validation',
                    description: 'Field for testing of a patternKey/patternValue validation',
                    patternKey: '^\\w+$',
                    patternValue: '^\\w+$',
                    minProperties: 1,
                    maxProperties: 2,
                    nullable: true,
                },
            });
            const inputs = [
                // Invalid
                {}, // Fails required check
                { field: [] }, // Fails type check
                { field: {} }, // Fails minProperties check
                { field: { a$: '' } }, // Fails patternKey check
                { field: { a: '$' } }, // Fails patternValue check
                { field: { a: 'a', b: 'b', c: 'c' } }, // Fails maxProperties check
                // Valid
                { field: null },
                { field: { a: 'a' } },
                { field: { a: 'a', b: 'b' } },
            ];

            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 6 invalid inputs
            expect(results.length).toEqual(6);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });
        it('should not allow additional properties when additionalProperties is set to false', () => {
            const inputSchema = {
                title: 'Testing input schema',
                type: 'object',
                schemaVersion: 1,
                additionalProperties: false,
                properties: {},
                required: [],
            };
            const validator = ajv.compile(inputSchema);
            const inputs = [
                // Invalid
                { field: 'a' }, // Fails type check
                // Valid
                {},
            ];

            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input))
                .filter((errors) => errors.length > 0);

            // There should be 1 invalid inputs
            expect(results.length).toEqual(1);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });
        it('should validate available proxy groups', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'proxy',
                    description: 'Field for testing of a proxy validation',
                },
            });
            const proxy = {
                hasAutoProxyGroups: true,
                availableProxyGroups: ['A', 'B', 'C'],
            };
            const inputs = [
                // Invalid
                { field: { useApifyProxy: true, apifyProxyGroups: ['D'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['D', 'E'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['A', 'D', 'E'] } },
                // Valid
                { field: { useApifyProxy: true, apifyProxyGroups: [] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['A'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['A', 'B', 'C'] } },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input, { proxy }))
                .filter((errors) => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).toEqual(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });
        it('should validate blocked proxy groups', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'proxy',
                    description: 'Field for testing of a proxy validation',
                },
            });
            const proxy = {
                hasAutoProxyGroups: true,
                availableProxyGroups: ['A', 'B', 'C'],
                disabledProxyGroups: { B: 'B is blocked', C: 'C is blocked' },
            };
            const inputs = [
                // Invalid
                { field: { useApifyProxy: true, apifyProxyGroups: ['B'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['B', 'C'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['A', 'B'] } },
                // Valid
                { field: { useApifyProxy: true, apifyProxyGroups: [] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['A'] } },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input, { proxy }))
                .filter((errors) => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).toEqual(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });
        it('should validate auto mode', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'proxy',
                    description: 'Field for testing of a proxy validation',
                },
            });
            const proxy = {
                hasAutoProxyGroups: false,
                availableProxyGroups: ['RESIDENTIAL', 'GOOGLE_SERP'],
                disabledProxyGroups: {},
            };
            const inputs = [
                // Invalid
                { field: { useApifyProxy: true } },
                { field: { useApifyProxy: true, apifyProxyGroups: [] } },
                { field: { useApifyProxy: true, apifyProxyGroups: null } },
                // Valid
                { field: { useApifyProxy: true, apifyProxyGroups: ['GOOGLE_SERP'] } },
                { field: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] } },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input, { proxy }))
                .filter((errors) => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).toEqual(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate custom proxy urls with regexp', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'proxy',
                    description: 'Field for testing of a proxy validation',
                },
            });
            const proxy = null;
            const inputs = [
                // Invalid
                { field: { useApifyProxy: false, proxyUrls: ['https://asdasd:qweqe@proxy.apify.com:8000'] } }, // https
                { field: { useApifyProxy: false, proxyUrls: ['http://asdasd:qweqe@proxy.apify.com'] } }, // missing port
                { field: { useApifyProxy: false, proxyUrls: ['http://asdasd:qweqe@proxy.apify.com:8000/asd'] } }, // path after port
                { field: { useApifyProxy: false, proxyUrls: ['http://asdasd@qweqe@proxy.apify.com:8000'] } }, // malformed url
                { field: { useApifyProxy: false, proxyUrls: ['http://asdasd:qweqe:proxy.apify.com:8000'] } }, // malformed url
                // Valid
                { field: { useApifyProxy: false, proxyUrls: ['http://proxy.apify.com:8000'] } }, // without auth
                { field: { useApifyProxy: false, proxyUrls: ['http://qweqe@proxy.apify.com:6000'] } }, // without password
                { field: { useApifyProxy: false, proxyUrls: ['http://asd:qweqe@proxy.apify.com:55555'] } }, // with auth
                { field: { useApifyProxy: false, proxyUrls: ['http://asd:qweqe@127.0.0.1:5555'] } }, // with IP address
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input, { proxy }))
                .filter((errors) => errors.length > 0);

            // There should be 5 invalid inputs
            expect(results.length).toEqual(5);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });

        it('should validate Apify proxy country', () => {
            const { inputSchema, validator } = buildInputSchema({
                field: {
                    type: 'object',
                    editor: 'proxy',
                    title: 'proxy',
                    description: 'Field for testing of a proxy validation',
                },
            });
            const proxy = null;
            // If Apify proxy is used, apifyProxyCountry must be either undefined, an empty string or a valid country code
            // If Apify proxy is not used, apifyProxyCountry must not be set
            const inputs = [
                // Invalid
                { field: { useApifyProxy: true, apifyProxyCountry: 123 } },
                { field: { useApifyProxy: true, apifyProxyCountry: {} } },
                { field: { useApifyProxy: true, apifyProxyCountry: 'XY' } },
                { field: { useApifyProxy: true, apifyProxyCountry: 'Czech Republic' } },
                { field: { useApifyProxy: false, apifyProxyCountry: 'CZ' } },
                // Valid
                { field: { useApifyProxy: true } },
                { field: { useApifyProxy: true, apifyProxyCountry: '' } },
                { field: { useApifyProxy: true, apifyProxyCountry: 'CZ' } },
                { field: { useApifyProxy: true, apifyProxyCountry: 'US' } },
            ];
            const results = inputs
                .map((input) => validateInputUsingValidator(validator, inputSchema, input, { proxy }))
                .filter((errors) => errors.length > 0);

            // There should be 5 invalid inputs
            expect(results.length).toEqual(5);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).toEqual(1);
                expect(result[0].fieldKey).toEqual('field');
            });
        });
    });

    describe('#jsonStringifyExtended()', () => {
        it('should work', () => {
            const value = {
                foo: 'bar',
                date: new Date('2019-05-06T13:08:15.590Z'),
                num: 1,
                boolean: true,
                arr: [
                    1,
                    'something',
                    (a: number, b: number) => a + b,
                ],
                obj: {
                    foo: 'bar',
                    arrFunc: (x: number, y: number) => {
                        return x + y;
                    },
                    /* eslint-disable */
                    myFunc: function (z: any) {
                        return 'z';
                    },
                    /* eslint-enable */
                },
            };

            const expected = `{
  "foo": "bar",
  "date": "2019-05-06T13:08:15.590Z",
  "num": 1,
  "boolean": true,
  "arr": [
    1,
    "something",
    "(a, b) => a + b"
  ],
  "obj": {
    "foo": "bar",
    "arrFunc": "(x, y) => {\\n                        return x + y;\\n                    }",
    "myFunc": "function (z) {\\n                        return 'z';\\n                    }"
  }
}`;

            expect(jsonStringifyExtended(value, null, 2)).toEqual(expected);
        });

        it('should extend original replacer', () => {
            const value = {
                foo: 'bar',
                date: new Date('2019-05-06T13:08:15.590Z'),
                num: 1,
                func: (x: number, y: number) => {
                    return x + y;
                },
            };

            const expected = `{
  "foo": "bar",
  "date": "2019-05-06T13:08:15.590Z",
  "func": "(x, y) => {\\n                    return x + y;\\n                }"
}`;

            // Replacer removes number properties.
            const replacer = (key: string, val: any) => {
                return _.isNumber(val) ? undefined : val;
            };

            expect(jsonStringifyExtended(value, replacer, 2)).toBe(expected);
        });

        it('should support tokens', () => {
            const value = {
                foo: 'bar',
                num: 1,
                obj: {
                    foo: 'bar',
                    rpl: new JsonVariable('my.token'),
                },
            };

            const expected = `{
  "foo": "bar",
  "num": 1,
  "obj": {
    "foo": "bar",
    "rpl": {{my.token}}
  }
}`;

            expect(jsonStringifyExtended(value, null, 2)).toEqual(expected);
        });
    });

    describe('#splitFullName()', () => {
        it('it works', () => {
            // invalid args
            expect(splitFullName('')).toEqual([null, null]);
            // @ts-expect-error
            expect(splitFullName(null)).toEqual([null, null]);
            // @ts-expect-error
            expect(splitFullName({})).toEqual([null, null]);
            // @ts-expect-error
            expect(splitFullName(123456)).toEqual([null, null]);

            // valid args
            expect(splitFullName('')).toEqual([null, null]);
            expect(splitFullName('        ')).toEqual([null, null]);
            expect(splitFullName('   John Newman     ')).toEqual(['John', 'Newman']);
            expect(splitFullName('   John \t\n\r Newman     ')).toEqual(['John', '\t\n\r Newman']);
            expect(splitFullName('John Paul New\nman')).toEqual(['John', 'Paul New\nman']);
            expect(splitFullName('John Paul Newman  Karl   Ludvig   III')).toEqual(['John', 'Paul Newman Karl Ludvig III']);
            expect(splitFullName('New-man')).toEqual([null, 'New-man']);
            expect(splitFullName('  New  man  ')).toEqual(['New', 'man']);
            expect(splitFullName('More    Spaces Between')).toEqual(['More', 'Spaces Between']);
        });
    });
});
