// The fact this is needed makes Vlad cry.
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const file = resolve(__dirname, '..', 'dist', 'esm', 'index.mjs');

const fileContent = readFileSync(file, 'utf8');
const fixed = fileContent
    .replace(
        'import { parseScript } from "escaya";',
        `import escaya from "escaya";
const { parseScript } = escaya;`,
    );

writeFileSync(file, fixed);
