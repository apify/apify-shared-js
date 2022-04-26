# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.10...@apify/log@1.2.0) (2022-04-26)


### Features

* allow `null` in additional log data ([#292](https://github.com/apify/apify-shared-js/issues/292)) ([f2f8350](https://github.com/apify/apify-shared-js/commit/f2f8350177ffc7593066c9415efa95a6db6da9b4))





## [1.1.10](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.9...@apify/log@1.1.10) (2022-01-21)

**Note:** Version bump only for package @apify/log





## [1.1.9](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.8...@apify/log@1.1.9) (2022-01-21)

**Note:** Version bump only for package @apify/log





## [1.1.8](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.7...@apify/log@1.1.8) (2022-01-11)

**Note:** Version bump only for package @apify/log





## [1.1.7](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.6...@apify/log@1.1.7) (2021-12-14)

**Note:** Version bump only for package @apify/log





## [1.1.6](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.5...@apify/log@1.1.6) (2021-11-15)

**Note:** Version bump only for package @apify/log





## [1.1.5](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.4...@apify/log@1.1.5) (2021-10-26)

**Note:** Version bump only for package @apify/log





## [1.1.4](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.3...@apify/log@1.1.4) (2021-09-28)

**Note:** Version bump only for package @apify/log





## [1.1.3](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.2...@apify/log@1.1.3) (2021-08-26)

**Note:** Version bump only for package @apify/log





## [1.1.2](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.1...@apify/log@1.1.2) (2021-08-16)

**Note:** Version bump only for package @apify/log





## [1.1.1](https://github.com/apify/apify-shared-js/compare/@apify/log@1.1.0...@apify/log@1.1.1) (2021-07-19)


### Bug Fixes

* do not print empty data in logger ([#236](https://github.com/apify/apify-shared-js/issues/236)) ([7a39f62](https://github.com/apify/apify-shared-js/commit/7a39f621244eaa0225a56c85949d3b2c3e8e4ad2))





# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.5...@apify/log@1.1.0) (2021-07-02)


### Features

* adds escaping of functions into logger ([#216](https://github.com/apify/apify-shared-js/issues/216)) ([0d34090](https://github.com/apify/apify-shared-js/commit/0d34090346d15f56f7e67ee4a1b11b1ea2802065))





## [1.0.5](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.4...@apify/log@1.0.5) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





## [1.0.4](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.3...@apify/log@1.0.4) (2021-06-08)

**Note:** Version bump only for package @apify/log





## [1.0.3](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.2...@apify/log@1.0.3) (2021-06-07)

**Note:** Version bump only for package @apify/log





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.1...@apify/log@1.0.2) (2021-06-07)

**Note:** Version bump only for package @apify/log





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/log@1.0.0...@apify/log@1.0.1) (2021-06-03)

**Note:** Version bump only for package @apify/log





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
