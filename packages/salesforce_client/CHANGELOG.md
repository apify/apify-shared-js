# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.6](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.5...@apify/salesforce_client@1.0.6) (2022-03-08)

**Note:** Version bump only for package @apify/salesforce_client





## [1.0.5](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.4...@apify/salesforce_client@1.0.5) (2021-10-25)

**Note:** Version bump only for package @apify/salesforce_client





## [1.0.4](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.3...@apify/salesforce_client@1.0.4) (2021-10-12)

**Note:** Version bump only for package @apify/salesforce_client





## [1.0.3](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.2...@apify/salesforce_client@1.0.3) (2021-10-04)

**Note:** Version bump only for package @apify/salesforce_client





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.1...@apify/salesforce_client@1.0.2) (2021-09-13)

**Note:** Version bump only for package @apify/salesforce_client





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/salesforce_client@1.0.0...@apify/salesforce_client@1.0.1) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
