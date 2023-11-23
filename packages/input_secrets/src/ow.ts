// This file is needed to solve ow's false representation of the package in older versions, as well as other issues due to tsup and double build issues

// In CJS, to use ow, you need to call ow.default
// In ESM, you'd think `import ow from 'ow'` works, but it doesn't, because you need to import ow and use the default PROPERTY, not export.

import { createRequire } from 'node:module';

import type { Ow } from 'ow';

// Why do we need this?
// - By using just `require` (not `globalThis.require`), tsup polyfills it with a method that throws in ESM builds
// - By using `globalThis.require`, the typeof check will NOT be replaced with the typeof check for tsup's polyfill (and globalThis.require IS present)
// - By using `createRequire`, we can import ow like we do for CJS builds, making it all work 🎉

// eslint-disable-next-line no-underscore-dangle
const _require: typeof require = typeof globalThis.require !== 'undefined' ? require : createRequire(__dirname);

const defOw = _require('ow');
export const ow: Ow = defOw.default as Ow;
