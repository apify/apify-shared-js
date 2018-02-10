import { Transform } from 'stream';

/**
 * A transforming stream which accepts string/Buffer data with JSON Lines objects on input
 * and emits 'object' event for every parsed JavaScript objects.
 * The stream passes through the original data.
 * Each JSON object is expected to be on a separate line, some lines might be empty or contain whitespace.
 * After each JSON object there needs to be '\n' or end of stream.
 * This stream is especially useful for processing stream from Docker engine, such as:
 * <pre>
 *  {"status":"Preparing","progressDetail":{},"id":"e0380bb6c0bb"}
 *  {"status":"Preparing","progressDetail":{},"id":"9f8566ee5135"}
 *  {"errorDetail":{"message":"no basic auth credentials"},"error":"no basic auth credentials"}
 * </pre>
 */
export default class ParseJsonlStream extends Transform {
    constructor(options) {
        super(options);

        this.pendingChunk = null;
    }

    parseLineAndEmitObject(line) {
        line = line.trim();
        if (line) {
            let obj;
            try {
                obj = JSON.parse(line);
            } catch (e) {
                throw new Error(`Cannot parse JSON stream data ('${String(line)}'): ${String(e)}`);
            }

            this.emit('object', obj);
        }
    }

    _transform(chunk, encoding, callback) {
        let allData;
        if (this.pendingChunk) {
            allData = this.pendingChunk + chunk;
            this.pendingChunk = null;
        } else {
            allData = chunk;
        }

        const lines = allData.toString().split('\n');

        // One line can span multiple chunks, so if the new chunk doesn't end with '\n',
        // store the last part and later concat it with the new chunk
        if (lines[lines.length - 1] !== '') {
            this.pendingChunk = lines.pop();
        }

        try {
            for (let i = 0; i < lines.length; i++) {
                this.parseLineAndEmitObject(lines[i]);
            }
        } catch (err) {
            callback(err, null);
            return;
        }

        callback(null, chunk);
    }

    // This function is called right after stream.end() is called by the writer.
    // It just tries to process the pending chunk and returns an error if that fails.
    _flush(callback) {
        if (this.pendingChunk) {
            try {
                this.parseLineAndEmitObject(this.pendingChunk);
                this.pendingChunk = null;
            } catch (err) {
                callback(err, null);
                return;
            }
        }
        callback();
    }
}
