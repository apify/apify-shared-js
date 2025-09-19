// Some schemas are static json files, but other are generated from code during the build step
// This script generates those schemas and writes them to the `schemas` folder

import { writeFileSync } from 'node:fs';

import { actorSchema } from '../src/actor.schema';

const schemasToBuild = [
    { schema: actorSchema, filename: 'schemas/actor.schema.json' },
];

for (const { schema, filename } of schemasToBuild) {
    writeFileSync(filename, JSON.stringify(schema, null, 2));
}
