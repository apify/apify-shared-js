import assert from 'assert';
import ParseJsonlStream from '../build/parse_jsonl_stream';

const OBJS = [
    { a: 123 },
    { bb: 234 },
    { ccc: 345 },
    { dddd: 456 },
    5555,
    'string',
    true,
    false,
];

describe('parse_jsonl_stream', () => {
    it('works on various objects', () => {
        const parseJsonl = new ParseJsonlStream();

        parseJsonl.on('error', (err) => {
            assert.fail(err);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            assert.deepEqual(OBJS[count++], obj);
        });

        parseJsonl.write('');
        parseJsonl.write('    \n  \t    \r   ');

        OBJS.forEach((obj) => {
            parseJsonl.write(`${JSON.stringify(obj)}\n`);
        });

        parseJsonl.end('');
    });

    it('handles JSON obj split over multiple lines', () => {
        const parseJsonl = new ParseJsonlStream();

        parseJsonl.on('error', (err) => {
            assert.fail(err);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            switch (count++) {
                case 0: assert.deepEqual({ aaa: 123 }, obj); break;
                case 1: assert.deepEqual(true, obj); break;
                case 2: assert.deepEqual(555666, obj); break;
                case 3: assert.deepEqual('string', obj); break;
                default: assert.fail(); break;
            }
        });

        parseJsonl.write(' { "aaa" : ');
        parseJsonl.write('  ');
        parseJsonl.write(' 123 } ');
        parseJsonl.write('  ');
        parseJsonl.write('  \n ');
        parseJsonl.write(' true\n  555');
        parseJsonl.write('6');
        parseJsonl.end('66\n "string"');
    });

    it('handles multiple JSON lines', () => {
        const parseJsonl = new ParseJsonlStream();

        parseJsonl.on('error', (err) => {
            assert.fail(err);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            assert.deepEqual(OBJS[count++], obj);
        });

        let json = '';
        OBJS.forEach((obj) => {
            json += `${JSON.stringify(obj)}\n`;
        });
        parseJsonl.write(json);
    });

    it('fails on invalid JSON', () => {
        const parseJsonl = new ParseJsonlStream();

        parseJsonl.on('object', () => {
            assert.fail();
        });

        let failed = false;
        parseJsonl.on('error', (err) => {
            assert(err.message.indexOf('Cannot parse JSON stream data') >= 0);
            failed = true;
        });

        parseJsonl.write('');
        parseJsonl.write('{"invalid: json}\n');

        assert.ok(failed);
    });

    it('fails on unfinished JSON', () => {
        const parseJsonl = new ParseJsonlStream();

        let failed = false;
        parseJsonl.on('error', (err) => {
            assert(err.message.indexOf('Cannot parse JSON stream data') >= 0);
            failed = true;
        });

        parseJsonl.write('{ "aaa" :');
        parseJsonl.end('"aaa');

        assert.ok(failed);
    });
});
