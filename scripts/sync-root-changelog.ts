import { writeFileSync } from 'fs';
import { resolve } from 'path';

// this script should be called with output from `lerna ls --json`, like:
// `lerna ls --json | ts-node -T scripts/sync-root-changelog.ts`
const stdin = process.openStdin();
let data = '';

function generateChangelog(packages: { name: string; version: string; location: string }[]) {
    let tpl = `# \`apify-shared\` monorepo

\`apify-shared\` is now an independently versioned monorepo.

> This file is generated.

See the changelogs of each package:

package | version | changelog
--------|---------|----------
`;

    packages.forEach((pkg) => {
        const path = pkg.location.replace(process.cwd(), '.');
        tpl += `\`${pkg.name}\` | ${pkg.version} | [CHANGELOG](${path}/CHANGELOG.md)\n`;
    });
    const target = resolve(process.cwd(), 'CHANGELOG.md');
    writeFileSync(target, tpl);
}

stdin.on('data', (chunk) => {
    data += chunk;
});

stdin.on('end', () => {
    const json = JSON.parse(data);
    generateChangelog(json);
});
