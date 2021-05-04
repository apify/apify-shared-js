import { PassThrough, Readable } from 'stream';

/**
 * Concat data from stream to Buffer
 */
export async function concatStreamToBuffer(stream: Readable | PassThrough): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream
            .on('data', (chunk) => {
                chunks.push(chunk);
            })
            .on('error', (e) => reject(e))
            .on('end', () => {
                const buffer = Buffer.concat(chunks);
                return resolve(buffer);
            });
    });
}

/**
 * Flushes the provided stream into a Buffer and transforms
 * it to a String using the provided encoding or utf-8 as default.
 */
export async function readStreamToString(stream: Readable | PassThrough, encoding?: BufferEncoding): Promise<string> {
    const buffer = await concatStreamToBuffer(stream);
    return buffer.toString(encoding);
}
