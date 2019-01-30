import _ from 'underscore';
import { assert } from 'chai';

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
});
