# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.0.0...@apify/consts@1.1.0) (2021-06-03)


### Features

* Increased length of actor name ([#174](https://github.com/apify/apify-shared-js/issues/174)) ([0034f9d](https://github.com/apify/apify-shared-js/commit/0034f9de77515bd613f1092ecf31ed22aead860d))





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
