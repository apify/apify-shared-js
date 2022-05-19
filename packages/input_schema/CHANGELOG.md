# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.10](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.9...@apify/input_schema@2.0.10) (2022-05-19)

**Note:** Version bump only for package @apify/input_schema





## [2.0.9](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.8...@apify/input_schema@2.0.9) (2022-05-18)

**Note:** Version bump only for package @apify/input_schema





## [2.0.8](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.7...@apify/input_schema@2.0.8) (2022-01-21)

**Note:** Version bump only for package @apify/input_schema





## [2.0.7](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.6...@apify/input_schema@2.0.7) (2022-01-21)

**Note:** Version bump only for package @apify/input_schema





## [2.0.6](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.5...@apify/input_schema@2.0.6) (2022-01-11)

**Note:** Version bump only for package @apify/input_schema





## [2.0.5](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.4...@apify/input_schema@2.0.5) (2021-12-14)

**Note:** Version bump only for package @apify/input_schema





## [2.0.4](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.3...@apify/input_schema@2.0.4) (2021-11-15)

**Note:** Version bump only for package @apify/input_schema





## [2.0.3](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.2...@apify/input_schema@2.0.3) (2021-10-26)

**Note:** Version bump only for package @apify/input_schema





## [2.0.2](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.1...@apify/input_schema@2.0.2) (2021-09-28)

**Note:** Version bump only for package @apify/input_schema





## [2.0.1](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@2.0.0...@apify/input_schema@2.0.1) (2021-08-26)

**Note:** Version bump only for package @apify/input_schema





# [2.0.0](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.5...@apify/input_schema@2.0.0) (2021-08-23)


### Features

* update input schema to use ajv v8 ([#247](https://github.com/apify/apify-shared-js/issues/247)) ([e7693f3](https://github.com/apify/apify-shared-js/commit/e7693f35d12c0545d3597a2bb9fbfd696bfab77a))


### BREAKING CHANGES

* update ajv to v8 and set it as peerDependency





## [1.0.5](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.4...@apify/input_schema@1.0.5) (2021-08-16)

**Note:** Version bump only for package @apify/input_schema





## [1.0.4](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.3...@apify/input_schema@1.0.4) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





## [1.0.3](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.2...@apify/input_schema@1.0.3) (2021-06-08)

**Note:** Version bump only for package @apify/input_schema





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.1...@apify/input_schema@1.0.2) (2021-06-07)

**Note:** Version bump only for package @apify/input_schema





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/input_schema@1.0.0...@apify/input_schema@1.0.1) (2021-06-03)

**Note:** Version bump only for package @apify/input_schema





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
