import type { PassThrough, Readable } from 'node:stream';

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

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
    return typeof value === 'object' && !!value && Symbol.asyncIterator in value;
}

async function asyncIterableToArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iterable) {
        out.push(item);
    }

    return out;
}

export function iterableToArray<T>(iterable: AsyncIterable<T>): Promise<T[]>;
export function iterableToArray<T>(iterable: Iterable<T>): T[];

/**
 * Collect items from an iterable object or an async iterable into an array.
 */
export function iterableToArray<T>(iterable: AsyncIterable<T> | Iterable<T>) {
    if (isAsyncIterable(iterable)) {
        return asyncIterableToArray(iterable);
    }

    const out: T[] = [];
    for (const item of iterable) {
        out.push(item);
    }

    return out;
}
