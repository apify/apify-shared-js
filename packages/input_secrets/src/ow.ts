// This file is needed to solve ow's false representation of the package in older versions.

// In CJS, to use ow, you need to call ow.default
// In ESM, you'd think `import ow from 'ow'` works, but it doesn't, because you need to import ow and use the default PROPERTY, not export.

import type { Ow } from 'ow';
import defOw = require('ow');

export const ow: Ow = defOw.default as Ow;
