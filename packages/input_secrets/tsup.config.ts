import type { Options } from 'tsup';
import { createTsupConfig } from '../../scripts/tsup.config';

const shared: Options = {
    banner(ctx) {
        switch (ctx.format) {
            case 'cjs': {
                return {
                    js: `const __ow_import = require('ow');
const __injectedOw = __ow_import.default || __ow_import;`,
                };
            }
            case 'esm': {
                return {
                    js: `import __ow_import from 'ow';
const __injectedOw = __ow_import.default || __ow_import;`,
                };
            }
            default: {
                return {};
            }
        }
    },
    shims: true,
};

export default createTsupConfig({
    cjsOptions: {
        ...shared,
    },
    esmOptions: {
        ...shared,
    },
});
