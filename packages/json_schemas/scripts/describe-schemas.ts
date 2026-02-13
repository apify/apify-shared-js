/* eslint-disable no-console */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseRuleFile } from '../tools/modificator/description-file-utils';
import { enchantJsonSchema, parseJsonContent } from '../tools/modificator/utils';

const PACKAGE_DIR = path.resolve(__dirname, '..');

const SCHEMA_MAPPING: { source: string; outputName: string }[] = [
    { source: 'actor.schema.json', outputName: 'actor' },
    { source: 'dataset.schema.json', outputName: 'dataset' },
    { source: 'input.schema.json', outputName: 'input' },
    { source: 'key_value_store.schema.json', outputName: 'key-value-store' },
    { source: 'output.schema.json', outputName: 'output' },
    { source: 'json-schema-draft-07.json', outputName: 'draft-07-schema' },
];

async function main() {
    const outputDir = path.join(PACKAGE_DIR, 'output');
    await fs.mkdir(outputDir, { recursive: true });

    for (const { source, outputName } of SCHEMA_MAPPING) {
        const schemaPath = path.join(PACKAGE_DIR, 'schemas', source);
        const rulesPath = path.join(PACKAGE_DIR, 'rules', 'add-description', `${outputName}.description-rules.xml`);

        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        const schema = parseJsonContent(schemaContent);

        const rulesContent = await fs.readFile(rulesPath, 'utf8');
        const rules = parseRuleFile(rulesContent);

        const result = await enchantJsonSchema(schema, rules);

        const outputPath = path.join(outputDir, `${outputName}.json`);
        await fs.writeFile(outputPath, `${JSON.stringify(result, null, 4)}\n`, 'utf8');

        console.log(`Described: ${source} → output/${outputName}.json`);
    }

    console.log('Done! All described schemas written to output/');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
