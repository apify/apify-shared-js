# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.7...@apify/utilities@1.2.0) (2021-10-12)


### Features

* update `FORBIDDEN_USERNAMES_REGEXPS` ([#259](https://github.com/apify/apify-shared-js/issues/259)) ([ff40398](https://github.com/apify/apify-shared-js/commit/ff40398a57f2cad4b92bd9188009ae3917b8763b))





## [1.1.7](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.6...@apify/utilities@1.1.7) (2021-09-28)

**Note:** Version bump only for package @apify/utilities





## [1.1.6](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.5...@apify/utilities@1.1.6) (2021-09-13)

**Note:** Version bump only for package @apify/utilities





## [1.1.5](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.4...@apify/utilities@1.1.5) (2021-08-26)

**Note:** Version bump only for package @apify/utilities





## [1.1.4](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.3...@apify/utilities@1.1.4) (2021-08-20)


### Bug Fixes

* add more forbidden usernames ([#246](https://github.com/apify/apify-shared-js/issues/246)) ([02d75f1](https://github.com/apify/apify-shared-js/commit/02d75f14adffbdb85360cf0ad20305ffc4c39c9a))





## [1.1.3](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.2...@apify/utilities@1.1.3) (2021-08-16)

**Note:** Version bump only for package @apify/utilities





## [1.1.2](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.1...@apify/utilities@1.1.2) (2021-07-19)

**Note:** Version bump only for package @apify/utilities





## [1.1.1](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.1.0...@apify/utilities@1.1.1) (2021-07-02)

**Note:** Version bump only for package @apify/utilities





# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.6...@apify/utilities@1.1.0) (2021-06-28)


### Features

* added toString object property into escape property names for BSON ([#208](https://github.com/apify/apify-shared-js/issues/208)) ([8cce24a](https://github.com/apify/apify-shared-js/commit/8cce24a9b1ddabcbaf27e55fec775e6feb4c2c89))





## [1.0.6](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.5...@apify/utilities@1.0.6) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





## [1.0.5](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.4...@apify/utilities@1.0.5) (2021-06-08)

**Note:** Version bump only for package @apify/utilities





## [1.0.4](https://github.com/apify/apify-shared-js/compare/@apify/utilities@1.0.3...@apify/utilities@1.0.4) (2021-06-07)

**Note:** Version bump only for package @apify/utilities





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
