import { ParseJsonlStream } from '@apify/utilities';

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
            expect(err).toBeInstanceOf(Error);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            expect(OBJS[count++]).toEqual(obj);
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
            expect(err).toBeInstanceOf(Error);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            switch (count++) {
                case 0: expect({ aaa: 123 }).toEqual(obj); break;
                case 1: expect(true).toEqual(obj); break;
                case 2: expect(555666).toEqual(obj); break;
                case 3: expect('string').toEqual(obj); break;
                default: throw new Error();
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
            expect(err).toBeInstanceOf(Error);
        });

        let count = 0;
        parseJsonl.on('object', (obj) => {
            expect(OBJS[count++]).toEqual(obj);
        });

        let json = '';
        OBJS.forEach((obj) => {
            json += `${JSON.stringify(obj)}\n`;
        });
        parseJsonl.write(json);
    });

    it('fails on invalid JSON', async (done) => {
        const parseJsonl = new ParseJsonlStream();

        parseJsonl.on('error', (err) => {
            expect(err.message.indexOf('Cannot parse JSON stream data') >= 0).toBe(true);
        });

        parseJsonl.write('');
        parseJsonl.write('{"invalid: json}\n');

        // It seems that the ParseJsonlStream is implemented in a way that emits
        // events in a sync fashion (i.e. not using nextTick or setImmediate).
        // This makes all the other tests pass, but not this one, because some Node 14
        // internals decided here that the error event should be emitted "later" anyway.
        // We need wait for next tick because of that. It would be great to rewrite the
        // stream to handle events properly, but given it's been like this since 2018,
        // I guess it would bring more trouble than benefit.
        process.nextTick(() => {
            done();
        });
    });

    it('fails on unfinished JSON', async (done) => {
        const parseJsonl = new ParseJsonlStream();

        let failed = false;
        parseJsonl.on('error', (err) => {
            expect(err.message).toMatch('Cannot parse JSON stream data');
            failed = true;
        });

        parseJsonl.write('{ "aaa" :');
        parseJsonl.end('"aaa');

        process.nextTick(() => {
            expect(failed).toBe(true);
            done();
        });
    });
});
