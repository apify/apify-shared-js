# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.4.0](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.3.1...@apify/hubspot_client@1.4.0) (2022-02-03)


### Features

* **hubspot_client:** add updateDeal method ([#281](https://github.com/apify/apify-shared-js/issues/281)) ([df2e509](https://github.com/apify/apify-shared-js/commit/df2e50999b09cbda6c38561c448d7380bd82e87c))





## [1.3.1](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.3.0...@apify/hubspot_client@1.3.1) (2021-11-15)

**Note:** Version bump only for package @apify/hubspot_client





# [1.3.0](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.2.0...@apify/hubspot_client@1.3.0) (2021-11-02)


### Features

* look up hubspot contact by HS additional emails ([#260](https://github.com/apify/apify-shared-js/issues/260)) ([a2a30f2](https://github.com/apify/apify-shared-js/commit/a2a30f2a7ca119fb70602287ad539c595a93fd08))





# [1.2.0](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.1.1...@apify/hubspot_client@1.2.0) (2021-09-14)


### Features

* add customer_segment to hubspot_client ([#250](https://github.com/apify/apify-shared-js/issues/250)) ([f409367](https://github.com/apify/apify-shared-js/commit/f409367085253b088ce222a29aefb5e89d35863d))





## [1.1.1](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.1.0...@apify/hubspot_client@1.1.1) (2021-09-13)

**Note:** Version bump only for package @apify/hubspot_client





# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.0.1...@apify/hubspot_client@1.1.0) (2021-07-30)


### Features

* added methods for working with companies ([#240](https://github.com/apify/apify-shared-js/issues/240)) ([0e9a418](https://github.com/apify/apify-shared-js/commit/0e9a418a73cbaf44ebc73f1b2f079e2c4c8bd34b))





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/hubspot_client@1.0.0...@apify/hubspot_client@1.0.1) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
