import { Transform } from 'stream';

/**
 * A transforming stream which accepts string/Buffer data with JSON objects on input
 * and emits 'object' event for every parsed JavaScript objects.
 * The stream passes through the original data.
 * Each JSON objects is expected to be on a separate line, some lines might be empty or contain whitespace.
 * This stream is especially useful for processing stream from Docker engine, such as:
 * <pre>
 *  {"status":"Preparing","progressDetail":{},"id":"e0380bb6c0bb"}
 *  {"status":"Preparing","progressDetail":{},"id":"9f8566ee5135"}
 *  {"errorDetail":{"message":"no basic auth credentials"},"error":"no basic auth credentials"}
 * </pre>
 */
export default class ParseJsonStream extends Transform {
    _transform(chunk, encoding, callback) {
        const lines = chunk.toString().split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                let obj;
                try {
                    obj = JSON.parse(line);
                } catch (e) {
                    callback(new Error(`Cannot parse JSON stream data ('${String(chunk)}'): ${String(e)}`));
                    return;
                }

                this.emit('object', obj);
            }
        }

        callback(null, chunk);
    }
}
