# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.1.3](https://github.com/apify/apify-shared-js/compare/@apify/git@2.1.2...@apify/git@2.1.3) (2024-10-14)

**Note:** Version bump only for package @apify/git





## [2.1.2](https://github.com/apify/apify-shared-js/compare/@apify/git@2.1.1...@apify/git@2.1.2) (2024-01-16)

**Note:** Version bump only for package @apify/git





## [2.1.1](https://github.com/apify/apify-shared-js/compare/@apify/git@2.1.0...@apify/git@2.1.1) (2024-01-15)


### Bug Fixes

* properly bundle to esm/cjs ([#430](https://github.com/apify/apify-shared-js/issues/430)) ([6775869](https://github.com/apify/apify-shared-js/commit/6775869d97d9006156a118044a66c4c0b644cb1f)), closes [#429](https://github.com/apify/apify-shared-js/issues/429)





# [2.1.0](https://github.com/apify/apify-shared-js/compare/@apify/git@2.0.0...@apify/git@2.1.0) (2023-02-14)


### Features

* **git:** update git parsing ([#359](https://github.com/apify/apify-shared-js/issues/359)) ([ef6313d](https://github.com/apify/apify-shared-js/commit/ef6313dc5135ababc966217593ff6731d0ab8597))





# [2.0.0](https://github.com/apify/apify-shared-js/compare/@apify/git@1.0.2...@apify/git@2.0.0) (2022-06-21)


### Features

* dual (native) ESM/CJS support all the packages ([#312](https://github.com/apify/apify-shared-js/issues/312)) ([daf882e](https://github.com/apify/apify-shared-js/commit/daf882ecdb3ff5b75975b92fc3528802a53bc736))


### BREAKING CHANGES

* All packages now have dual ESM/CJS build and require node 14+.





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/git@1.0.1...@apify/git@1.0.2) (2021-09-13)

**Note:** Version bump only for package @apify/git





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/git@1.0.0...@apify/git@1.0.1) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
