/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Creates a GitHub release for every tag produced by `lerna version`, with the matching section
// of the package changelog as the body. Lerna's own `createRelease` is disabled by `--no-push`
// (the release commit and tags are recreated signed via the API), so releases are made here.
const tags = (process.env.TAGS ?? '').split('\n').map((t) => t.trim()).filter(Boolean);
const packagesDir = resolve(import.meta.dirname, '..', 'packages');

const dirByName = new Map<string, string>();
for (const dir of readdirSync(packagesDir)) {
    try {
        const pkg = JSON.parse(readFileSync(resolve(packagesDir, dir, 'package.json'), 'utf8'));
        dirByName.set(pkg.name, dir);
    } catch {
        // not a package directory
    }
}

function changelogEntry(name: string, version: string): string {
    const dir = dirByName.get(name);
    if (!dir) return '';
    let changelog = '';

    try {
        changelog = readFileSync(resolve(packagesDir, dir, 'CHANGELOG.md'), 'utf8');
    } catch {
        return '';
    }

    // Entries look like `# [3.0.0](compare-url) (date)` (major/minor) or `## [3.0.1](...)` (patch)
    const escaped = version.replaceAll('.', '\\.');
    const entry = new RegExp(`^#{1,2} \\[?${escaped}[\\]) ].*?(?=^#{1,2} \\[?\\d|$(?![\\s\\S]))`, 'ms').exec(changelog);
    return entry ? entry[0].trim() : '';
}

let failures = 0;

for (const tag of tags) {
    const at = tag.lastIndexOf('@');
    const name = tag.slice(0, at);
    const version = tag.slice(at + 1);
    const body = changelogEntry(name, version) || `Release ${tag}`;

    try {
        execFileSync('gh', ['release', 'view', tag], { stdio: 'ignore' });
        console.info(`${tag}: release already exists, skipping`);
        continue;
    } catch {
        // no release yet
    }

    try {
        execFileSync('gh', ['release', 'create', tag, '--title', tag, '--notes', body], { stdio: 'inherit' });
        console.info(`${tag}: release created`);
    } catch {
        console.error(`${tag}: failed to create the release`);
        failures++;
    }
}

if (failures > 0) process.exit(1);
