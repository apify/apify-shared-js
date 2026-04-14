# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Internal Apify monorepo of shared TypeScript utilities and constants published as `@apify/*` packages on npm. Managed with Lerna (independent versioning) and npm workspaces.

## Commands

```bash
npm install              # Install all dependencies
npm run build            # Build all packages (lerna run build)
npm test                 # Run all tests (vitest)
npm run test-cov         # Run tests with coverage
npx vitest run test/consts.test.ts              # Run a single test file
npx vitest run test/consts.test.ts -t "pattern" # Run specific test by name
npm run lint             # Lint all source and test files
npm run lint:fix         # Lint with auto-fix
npm run clean            # Clean all dist/ folders
```

## Architecture

- **`packages/`** — Each subdirectory is a standalone npm package (`@apify/<name>`) with its own `package.json`, `tsconfig.json`, and `tsconfig.build.json`
- **`test/`** — All tests live in the root `test/` directory (not inside packages). Files named `*.test.ts`
- **`scripts/`** — Shared build tooling: tsup config, copy script, changelog sync
- Build produces dual CJS/ESM output via **tsup** into each package's `dist/`

## Key Conventions

- **Imports in tests:** Always use absolute package names (`@apify/consts`, not relative paths to package sources). Vitest's `resolve.alias` resolves `@apify/*` to `packages/*/src`
- **Cross-package imports in source:** Use absolute `@apify/*` paths. Within the same package, use relative imports. Never self-import a package by its own `@apify/*` name
- **Dev dependencies** go in the root `package.json` only. Runtime dependencies go in each package's own `package.json`
- **No build needed for tests** — Vitest compiles TypeScript directly from source via esbuild
- **Conventional commits** required: `fix:` (patch), `feat:` (minor), `BREAKING CHANGE:` in footer (major). Enforced by commitlint + husky hooks. PR titles must also follow this format
- **Adding a new package:** Copy an existing package directory, update `package.json` name/deps, keep the standard `build`/`clean`/`compile`/`copy` scripts
- Package dependencies must be declared in `package.json` so Lerna builds in correct topological order
