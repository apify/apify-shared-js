import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../src/schema.json');
const target = resolve(process.cwd(), 'dist/schema.json');

copyFileSync(root, target);
