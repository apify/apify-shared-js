# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.3](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.2...@apify/utilities@1.0.3) (2021-06-07)

**Note:** Version bump only for package @apify/utilities





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.1...@apify/utilities@1.0.2) (2021-06-03)

**Note:** Version bump only for package @apify/utilities





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.0...@apify/utilities@1.0.1) (2021-06-02)


### Bug Fixes

* make `configureLogger` accept `Log` instance instead of `Logger` ([#173](https://github.com/apify/apify-shared-js/issues/173)) ([39acce3](https://github.com/apify/apify-shared-js/commit/39acce31f9bb0a22523a23907b68c07908deafe0))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
