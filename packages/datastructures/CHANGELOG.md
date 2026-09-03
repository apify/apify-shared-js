# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.6...@apify/datastructures@3.0.0) (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))
* publish ESM-only packages and require Node.js 22+ ([#684](https://github.com/apify/apify-shared-js/issues/684)) ([338dbac](https://github.com/apify/apify-shared-js/commit/338dbac5df0cd7a991e06c747bb82af9aec562a6))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
* All packages are ESM-only and require Node.js 22 or higher. CommonJS consumers on Node.js 22+ can still require() them thanks to native require(esm) support.





## [2.0.6](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.5...@apify/datastructures@2.0.6) (2026-05-04)

**Note:** Version bump only for package @apify/datastructures





## [2.0.5](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.4...@apify/datastructures@2.0.5) (2026-04-29)

**Note:** Version bump only for package @apify/datastructures





## [2.0.4](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.3...@apify/datastructures@2.0.4) (2026-04-14)

**Note:** Version bump only for package @apify/datastructures





## [2.0.3](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.2...@apify/datastructures@2.0.3) (2025-04-08)

**Note:** Version bump only for package @apify/datastructures





## [2.0.2](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.1...@apify/datastructures@2.0.2) (2024-01-15)


### Bug Fixes

* properly bundle to esm/cjs ([#430](https://github.com/apify/apify-shared-js/issues/430)) ([6775869](https://github.com/apify/apify-shared-js/commit/6775869d97d9006156a118044a66c4c0b644cb1f)), closes [#429](https://github.com/apify/apify-shared-js/issues/429)





## [2.0.1](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@2.0.0...@apify/datastructures@2.0.1) (2024-01-03)

**Note:** Version bump only for package @apify/datastructures





# [2.0.0](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@1.0.1...@apify/datastructures@2.0.0) (2022-06-21)


### Features

* dual (native) ESM/CJS support all the packages ([#312](https://github.com/apify/apify-shared-js/issues/312)) ([daf882e](https://github.com/apify/apify-shared-js/commit/daf882ecdb3ff5b75975b92fc3528802a53bc736))


### BREAKING CHANGES

* All packages now have dual ESM/CJS build and require node 14+.





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/datastructures@1.0.0...@apify/datastructures@1.0.1) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
