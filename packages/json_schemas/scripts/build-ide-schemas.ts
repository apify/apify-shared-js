/* eslint-disable no-console */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { bundleJsonSchema } from '../tools/bundler/utils';
import { parseRuleFile } from '../tools/modificator/description-file-utils';
import { enchantJsonSchema, parseJsonContent } from '../tools/modificator/utils';

const PACKAGE_DIR = path.resolve(__dirname, '..');

const SCHEMA_NAMES = [
    'actor',
    'dataset',
    'input',
    'key-value-store',
    'output',
    'draft-07-schema',
];

async function main() {
    const outputDir = path.join(PACKAGE_DIR, 'output');

    // Step 1: Apply modification rules to all described schemas → write .ide.json
    for (const name of SCHEMA_NAMES) {
        const describedPath = path.join(outputDir, `${name}.json`);
        const rulesPath = path.join(PACKAGE_DIR, 'rules', 'modifications', `${name}.modification-rules.xml`);

        const schemaContent = await fs.readFile(describedPath, 'utf8');
        const schema = parseJsonContent(schemaContent);

        const rulesContent = await fs.readFile(rulesPath, 'utf8');
        const rules = parseRuleFile(rulesContent);

        const result = await enchantJsonSchema(schema, rules);

        const idePath = path.join(outputDir, `${name}.ide.json`);
        await fs.writeFile(idePath, `${JSON.stringify(result, null, 4)}\n`, 'utf8');

        console.log(`Modified: output/${name}.json → output/${name}.ide.json`);
    }

    // Step 2: Bundle all $ref references inline (must run after ALL .ide.json are written)
    for (const name of SCHEMA_NAMES) {
        const idePath = path.join(outputDir, `${name}.ide.json`);
        const bundled = await bundleJsonSchema(idePath);

        await fs.writeFile(idePath, `${JSON.stringify(bundled, null, 4)}\n`, 'utf8');

        console.log(`Bundled: output/${name}.ide.json`);
    }

    console.log('Done! All IDE schemas written to output/');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
