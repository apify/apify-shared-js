// scripts/export-schema.ts
import { writeFileSync } from 'node:fs';

import { actorSchema } from '../src/actor';

writeFileSync('schemas/actor.json', JSON.stringify(actorSchema, null, 2));
