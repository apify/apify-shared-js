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

    it('fails on invalid JSON', async () => {
        const parseJsonl = new ParseJsonlStream();

        let success;
        let failTest;
        // It seems that the ParseJsonlStream is implemented in a way that emits
        // events in a sync fashion (i.e. not using nextTick or setImmediate).
        // This makes all the other tests pass, but not this one, because some Node 14
        // internals decided here that the error event should be emitted "later" anyway.
        // We need this Promise magic because of that. It would be great to rewrite the
        // stream to handle events properly, but given it's been like this since 2018,
        // I guess it would bring more trouble than benefit.
        const finishPromise = new Promise((resolve, reject) => {
            success = resolve;
            failTest = reject;
        });

        parseJsonl.on('object', () => {
            failTest();
        });

        parseJsonl.on('error', (err) => {
            assert(err.message.indexOf('Cannot parse JSON stream data') >= 0);
            success();
        });

        parseJsonl.write('');
        parseJsonl.write('{"invalid: json}\n');

        await finishPromise;
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
