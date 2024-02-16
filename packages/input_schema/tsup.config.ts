import type { Options } from 'tsup';
import { createTsupConfig } from '../../scripts/tsup.config';

const shared: Options = {
    banner(ctx) {
        switch (ctx.format) {
            case 'cjs': {
                return {
                    js: `const __escaya_import = require('escaya');
const __injectedEscayaParseScript = __escaya_import.parseScript;`,
                };
            }
            // ESM builds fine with the current code, only CJS is scuffed
            case 'esm': {
                return {};
            }
            default: {
                return {};
            }
        }
    },
};

export default createTsupConfig({
    cjsOptions: {
        ...shared,
    },
    esmOptions: {
        ...shared,
    },
});
