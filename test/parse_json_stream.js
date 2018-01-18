import assert from 'assert';
import ParseJsonStream from '../build/parse_json_stream';

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

describe('parse_json_stream', () => {
    it('works on various objects', () => {
        const parseJson = new ParseJsonStream();

        let count = 0;
        parseJson.on('object', (obj) => {
            assert.deepEqual(OBJS[count++], obj);
        });

        parseJson.write('');
        parseJson.write('    \n  \t    \r   ');

        OBJS.forEach((obj) => {
            parseJson.write(JSON.stringify(obj));
        });

        parseJson.end('');
    });

    it('handles multiple JSON lines', () => {
        const parseJson = new ParseJsonStream();

        let count = 0;
        parseJson.on('object', (obj) => {
            assert.deepEqual(OBJS[count++], obj);
        });

        let json = '';
        OBJS.forEach((obj) => {
            json += `${JSON.stringify(obj)}\n`;
        });
        parseJson.write(json);
    });

    it('fails on invalid JSON', () => {
        const parseJson = new ParseJsonStream();

        parseJson.on('object', () => {
            assert.fail();
        });

        parseJson.on('error', (err) => {
            assert(err.message.indexOf('Cannot parse JSON stream data') >= 0);
        });

        parseJson.write('');
        parseJson.write('{"invalid: json}');
    });
});
