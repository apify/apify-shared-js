import _ from 'underscore';
import Ajv from 'ajv';
import { assert, expect } from 'chai';

// This clone doesn't work for array of NULLs (returns an empty array).
import brokenClone from 'clone';

import * as utils from '../build/utilities.client';


const clone = function (obj) {
    return _.isArray(obj) ? obj.slice(0) : brokenClone(obj);
};

const GOOD_OBJECTS = [
    {},
    null,
    undefined,
    123.456,
    'something',
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
        toBSON() {},
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
];

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


const testIsBadForMongo = function (obj, expectedResult) {
    // ensure the function doesn't change the object!!!
    const objClone = clone(obj);
    assert.equal(utils.isBadForMongo(obj), expectedResult);
    assert.deepEqual(obj, objClone);
};


// tests escapeForBson() or unescapeFromBson() function whether it converts objects as expected
const testEscape = function (escapeFunc, src, trg) {
    // don't change input parameters!

    // console.dir(src);
    // console.dir(trg);
    // console.log();

    const srcClone = clone(src);
    const trgClone = escapeFunc(srcClone, true);

    const isObject = function (obj) {
        return typeof (obj) === 'object';
    };
    const isDate = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    };

    // ensure srcClone didn't change
    if ((srcClone && isObject(srcClone) && !isDate(srcClone)) || (trgClone && isObject(trgClone) && !isDate(trgClone))) assert.notEqual(srcClone, trgClone);
    assert.deepEqual(srcClone, src);

    const trgNoClone = escapeFunc(srcClone, false);

    assert.equal(srcClone, trgNoClone);
    assert.deepEqual(srcClone, trgClone);
    assert.deepEqual(trgClone, trg);
};


describe('utilities.client', () => {
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
                testEscape(utils.escapeForBson, rec.src, rec.trg);
            });
        });

        it('leaves good objects unchanged', () => {
            GOOD_OBJECTS.forEach((obj) => {
                testEscape(utils.escapeForBson, obj, obj);
            });
        });

        it('works together with unescapeFromBson()', () => {
            BAD_REVERSIBLE_OBJECTS.forEach((obj) => {
                const escaped = utils.escapeForBson(obj, true);
                const unescaped = utils.unescapeFromBson(escaped, true);

                assert.deepEqual(unescaped, obj);

                testEscape(utils.escapeForBson, obj, escaped);
                testEscape(utils.unescapeFromBson, escaped, obj);
            });
        });
    });

    describe('#unescapeFromBson()', () => {
        it('works as expected on pre-defined records', () => {
            KNOWN_ESCAPES.forEach((rec) => {
                if (!rec.irreversible) testEscape(utils.unescapeFromBson, rec.trg, rec.src);
            });
        });

        it('leaves both good and bad objects unchanged', () => {
            GOOD_OBJECTS.forEach((obj) => {
                testEscape(utils.escapeForBson, obj, obj);
            });
            BAD_OBJECTS.forEach((obj) => {
                testEscape(utils.unescapeFromBson, obj, obj);
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
                assert.deepEqual(utils.getOrdinalSuffix(i), expected);
            }
        });
    });

    describe('#normalizeUrl', () => {
        it('should return null for invalid URLs', () => {
            assert.equal(
                utils.normalizeUrl('example.com'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('something'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('     127.0.0.1   '),
                null,
            );

            assert.equal(
                utils.normalizeUrl('http://'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('   http://'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('   http://     '),
                null,
            );

            assert.equal(
                utils.normalizeUrl(''),
                null,
            );

            assert.equal(
                utils.normalizeUrl('    '),
                null,
            );

            assert.equal(
                utils.normalizeUrl(),
                null,
            );

            assert.equal(
                utils.normalizeUrl(null),
                null,
            );

            assert.equal(
                utils.normalizeUrl(undefined),
                null,
            );

            assert.equal(
                utils.normalizeUrl({}),
                null,
            );
        });

        it('should persist protocols', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('https://example.com'),
                'https://example.com',
            );
        });

        it('should lowercase hostname and protocols', () => {
            assert.equal(
                utils.normalizeUrl('httpS://EXAMPLE.cOm'),
                'https://example.com',
            );

            assert.equal(
                utils.normalizeUrl('hTTp://www.EXAMPLE.com'),
                'http://www.example.com',
            );

            assert.equal(
                utils.normalizeUrl('SOMETHING://www.EXAMPLE.com/test'),
                'something://www.example.com/test',
            );
        });

        it('should remove trailing slash', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('ftp://example.com/'),
                'ftp://example.com',
            );

            assert.equal(
                utils.normalizeUrl('anything://example.com/test/'),
                'anything://example.com/test',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/test.html'),
                'http://example.com/test.html',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/test.html/'),
                'http://example.com/test.html',
            );
        });

        it('should remove ? when empty QSA', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/something?'),
                'http://example.com/something',
            );
        });

        it('should remove common tracking parameters', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_source=xyz'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_campaign=xyz&param=val'),
                'http://example.com?param=val',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_campaign=xyz&utm_source=neco'),
                'http://example.com',
            );
        });

        it('should sort parameters alphabetically', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?a=a&b=b&c=c'),
                'http://example.com?a=a&b=b&c=c',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?b=a&c=b&a=c'),
                'http://example.com?a=c&b=a&c=b',
            );
        });

        it('should handle keepFragment parameter correctly', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com#fragment', false),
                'http://example.com',
            );
            assert.equal(
                utils.normalizeUrl('http://example.com#', false),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com#fragment', true),
                'http://example.com#fragment',
            );
            assert.equal(
                utils.normalizeUrl('http://example.com#', true),
                'http://example.com',
            );


            assert.equal(
                utils.normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', true),
                'https://www.example.com#keyB=val1&keyA=val2',
            );
            assert.equal(
                utils.normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', false),
                'https://www.example.com',
            );
        });

        it('should not touch invalid or empty params', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?neco=&dalsi'),
                'http://example.com?dalsi&neco=',
            );
        });

        it('should normalize real-world URLs', () => {
            assert.equal(
                utils.normalizeUrl('https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt'
                    + '?utm_source=heureka.cz'
                    + '&utm_medium=cpc'
                    + '&utm_campaign=Notebooky'
                    + '&utm_term=Dell_XPS_15_9550_Touch_stribrna'),
                'https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt',
            );

            assert.equal(
                utils.normalizeUrl('http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580/'),
                'http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580',
            );
        });

        it('should trim all parts of URL', () => {
            assert.equal(
                utils.normalizeUrl('    http    ://     test    # fragment   '),
                'http://test',
            );

            assert.equal(
                utils.normalizeUrl('    http   ://     test    # fragment   ', true),
                'http://test#fragment',
            );
        });
    });
    describe('#buildOrVersionNumberIntToStr()', () => {
        it('should convert build number to string', () => {
            assert.equal(
                utils.buildOrVersionNumberIntToStr(200000),
                '0.2',
            );

            assert.equal(
                utils.buildOrVersionNumberIntToStr(10200001),
                '1.2.1',
            );
        });
        it('should return null if string passed', () => {
            assert.equal(
                utils.buildOrVersionNumberIntToStr('bla'),
                null,
            );
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
        const ajv = new Ajv({ cache: false });
        const buildInputSchema = (properties) => {
            const inputSchema = Object.assign({}, baseInputSchema, { properties });
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).to.be.equal(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 4 invalid inputs
            expect(results.length).to.be.equal(4);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 6 invalid inputs
            expect(results.length).to.be.equal(6);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 5 invalid inputs
            expect(results.length).to.be.equal(5);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 6 invalid inputs
            expect(results.length).to.be.equal(6);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input))
                .filter(errors => errors.length > 0);

            // There should be 1 invalid inputs
            expect(results.length).to.be.equal(1);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
            const proxyValidationOptions = {
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input, proxyValidationOptions))
                .filter(errors => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).to.be.equal(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
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
            const proxyValidationOptions = {
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
                .map(input => utils.validateInputUsingValidator(validator, inputSchema, input, proxyValidationOptions))
                .filter(errors => errors.length > 0);

            // There should be 3 invalid inputs
            expect(results.length).to.be.equal(3);
            results.forEach((result) => {
                // Only one error should be thrown
                expect(result.length).to.be.equal(1);
                expect(result[0].fieldKey).to.be.equal('field');
            });
        });
    });
});
