/*
THE FOLLOWING CODE IS LICENSED UNDER THE FOLLOWING LICENSE:

Copyright Joyent, Inc. and other Node contributors. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

// We've adapted the following code to work with our "error" representations (which are just nested simple objects)

import c from 'ansi-colors';

import { IS_APIFY_LOGGER_EXCEPTION } from './log_consts';

function identicalSequenceRange(a: any[], b: any[]) {
    for (let i = 0; i < a.length - 3; i++) {
        // Find the first entry of b that matches the current entry of a.
        const pos = b.indexOf(a[i]);
        if (pos !== -1) {
            const rest = b.length - pos;
            if (rest > 3) {
                let len = 1;
                const maxLen = Math.min(a.length - i, rest);
                // Count the number of consecutive entries.
                while (maxLen > len && a[i + len] === b[pos + len]) {
                    len++;
                }
                if (len > 3) {
                    return { len, offset: i };
                }
            }
        }
    }

    return { len: 0, offset: 0 };
}

function getStackString(error: any) {
    return error.stack ? String(error.stack) : Error.prototype.toString.call(error);
}

export function getStackFrames(err: Error, stack: string) {
    const frames = stack.split('\n');

    let cause;
    try {
        ({ cause } = err);
    } catch {
    // If 'cause' is a getter that throws, ignore it.
    }

    // Remove stack frames identical to frames in cause.
    if (cause != null && typeof cause === 'object' && IS_APIFY_LOGGER_EXCEPTION in (cause as any)) {
        const causeStack = getStackString(cause);
        const causeStackStart = causeStack.indexOf('\n    at');
        if (causeStackStart !== -1) {
            const causeFrames = causeStack.slice(causeStackStart + 1).split('\n');
            const { len, offset } = identicalSequenceRange(frames, causeFrames);
            if (len > 0) {
                const skipped = len - 2;
                const msg = `    ... ${skipped} lines matching cause stack trace ...`;
                frames.splice(offset + 1, skipped, c.grey(msg));
            }
        }
    }
    return frames;
}
