# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.5.0](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.14...@apify/timeout@0.5.0) (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))
* publish ESM-only packages and require Node.js 22+ ([#684](https://github.com/apify/apify-shared-js/issues/684)) ([338dbac](https://github.com/apify/apify-shared-js/commit/338dbac5df0cd7a991e06c747bb82af9aec562a6))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
* All packages are ESM-only and require Node.js 22 or higher. CommonJS consumers on Node.js 22+ can still require() them thanks to native require(esm) support.





## [0.4.14](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.13...@apify/timeout@0.4.14) (2026-09-02)

**Note:** Version bump only for package @apify/timeout





## [0.4.13](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.12...@apify/timeout@0.4.13) (2026-08-25)

**Note:** Version bump only for package @apify/timeout





## [0.4.12](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.11...@apify/timeout@0.4.12) (2026-08-24)

**Note:** Version bump only for package @apify/timeout





## [0.4.11](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.10...@apify/timeout@0.4.11) (2026-08-21)

**Note:** Version bump only for package @apify/timeout





## [0.4.10](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.9...@apify/timeout@0.4.10) (2026-08-20)

**Note:** Version bump only for package @apify/timeout





## [0.4.9](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.8...@apify/timeout@0.4.9) (2026-08-18)

**Note:** Version bump only for package @apify/timeout





## [0.4.8](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.7...@apify/timeout@0.4.8) (2026-08-03)

**Note:** Version bump only for package @apify/timeout





## [0.4.7](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.6...@apify/timeout@0.4.7) (2026-07-30)

**Note:** Version bump only for package @apify/timeout





## [0.4.6](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.5...@apify/timeout@0.4.6) (2026-07-30)

**Note:** Version bump only for package @apify/timeout





## [0.4.5](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.4...@apify/timeout@0.4.5) (2026-07-29)

**Note:** Version bump only for package @apify/timeout





## [0.4.4](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.3...@apify/timeout@0.4.4) (2026-07-21)

**Note:** Version bump only for package @apify/timeout





## [0.4.3](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.2...@apify/timeout@0.4.3) (2026-07-21)

**Note:** Version bump only for package @apify/timeout





## [0.4.2](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.1...@apify/timeout@0.4.2) (2026-07-20)

**Note:** Version bump only for package @apify/timeout





## [0.4.1](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.4.0...@apify/timeout@0.4.1) (2026-07-16)

**Note:** Version bump only for package @apify/timeout





# [0.4.0](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.5...@apify/timeout@0.4.0) (2026-07-16)


### Features

* **timeout:** add `extendTimeout` to push back a running deadline ([#669](https://github.com/apify/apify-shared-js/issues/669)) ([e40b66b](https://github.com/apify/apify-shared-js/commit/e40b66b5bc0ef24616d6007cf0e976b4b2594f4b)), closes [apify/crawlee#1485](https://github.com/apify/crawlee/issues/1485) [apify/crawlee#2951](https://github.com/apify/crawlee/issues/2951)





## [0.3.5](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.4...@apify/timeout@0.3.5) (2026-05-04)

**Note:** Version bump only for package @apify/timeout





## [0.3.4](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.3...@apify/timeout@0.3.4) (2026-04-29)

**Note:** Version bump only for package @apify/timeout





## [0.3.3](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.2...@apify/timeout@0.3.3) (2026-04-14)

**Note:** Version bump only for package @apify/timeout





## [0.3.2](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.1...@apify/timeout@0.3.2) (2025-04-08)

**Note:** Version bump only for package @apify/timeout





## [0.3.1](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.3.0...@apify/timeout@0.3.1) (2024-01-15)


### Bug Fixes

* properly bundle to esm/cjs ([#430](https://github.com/apify/apify-shared-js/issues/430)) ([6775869](https://github.com/apify/apify-shared-js/commit/6775869d97d9006156a118044a66c4c0b644cb1f)), closes [#429](https://github.com/apify/apify-shared-js/issues/429)





# [0.3.0](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.2.1...@apify/timeout@0.3.0) (2022-06-21)


### Features

* dual (native) ESM/CJS support all the packages ([#312](https://github.com/apify/apify-shared-js/issues/312)) ([daf882e](https://github.com/apify/apify-shared-js/commit/daf882ecdb3ff5b75975b92fc3528802a53bc736))


### BREAKING CHANGES

* All packages now have dual ESM/CJS build and require node 14+.





## [0.2.1](https://github.com/apify/apify-shared-js/compare/@apify/timeout@0.2.0...@apify/timeout@0.2.1) (2021-11-24)

**Note:** Version bump only for package @apify/timeout





# 0.2.0 (2021-11-22)


### Features

* add `@apify/timeout` package with abortable promise timeout helper ([#267](https://github.com/apify/apify-shared-js/issues/267)) ([9a54214](https://github.com/apify/apify-shared-js/commit/9a542145510d59d2ca4df8c49019585dfe1e2891))
