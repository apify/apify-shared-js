/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Run after `lerna version --conventional-prerelease --no-git-tag-version`: since beta releases
// leave no tags or commits behind, lerna always computes `X.Y.Z-beta.0`. The npm registry is the
// only record of published betas, so this rewrites the prerelease number to the next free one.
const packagesDir = resolve(import.meta.dirname, '..', 'packages');

for (const dir of readdirSync(packagesDir)) {
    const pkgPath = resolve(packagesDir, dir, 'package.json');
    let pkg: { name: string; version: string };

    try {
        pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch {
        continue;
    }

    const match = /^(\d+\.\d+\.\d+)-beta\.\d+$/.exec(pkg.version);
    if (!match) continue;

    const base = match[1];
    let published: string[] = [];

    try {
        published = JSON.parse(execSync(`npm show ${pkg.name} versions --json`, { encoding: 'utf8', stdio: 'pipe' }));
    } catch (err) {
        // E404 means the package was never published; anything else must not silently disable the guard below
        if (!String((err as { stderr?: unknown }).stderr ?? '').includes('E404')) throw err;
    }

    if (published.includes(base)) {
        console.error(`${pkg.name}: stable ${base} is already published, refusing to compute a beta for it`);
        process.exit(1);
    }

    const betaNumbers = published
        .filter((v) => v.startsWith(`${base}-beta.`))
        .map((v) => Number(v.slice(`${base}-beta.`.length)))
        .filter(Number.isInteger);
    const next = Math.max(-1, ...betaNumbers) + 1;

    const version = `${base}-beta.${next}`;
    console.info(`${pkg.name}: ${pkg.version} -> ${version}`);
    const source = readFileSync(pkgPath, 'utf8');
    const updated = source.replace(`"version": "${pkg.version}"`, `"version": "${version}"`);
    if (updated === source) throw new Error(`${pkg.name}: failed to rewrite the version in ${pkgPath}`);
    writeFileSync(pkgPath, updated);
}
