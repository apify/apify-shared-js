import { createTsupConfig } from '../../scripts/tsup.config.ts';

export default createTsupConfig({
    // `ow` is CJS with a `default` export; make sure we grab the callable function in ESM output
    banner: {
        js: `import __ow_import from 'ow';
const __injectedOw = __ow_import.default || __ow_import;`,
    },
    shims: true,
});
