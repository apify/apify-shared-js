# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.18](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.17...@apify/markdown@1.0.18) (2021-08-26)

**Note:** Version bump only for package @apify/markdown





## [1.0.17](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.16...@apify/markdown@1.0.17) (2021-08-23)

**Note:** Version bump only for package @apify/markdown





## [1.0.16](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.15...@apify/markdown@1.0.16) (2021-08-20)

**Note:** Version bump only for package @apify/markdown





## [1.0.15](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.14...@apify/markdown@1.0.15) (2021-08-16)

**Note:** Version bump only for package @apify/markdown





## [1.0.14](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.13...@apify/markdown@1.0.14) (2021-08-16)

**Note:** Version bump only for package @apify/markdown





## [1.0.13](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.12...@apify/markdown@1.0.13) (2021-08-09)

**Note:** Version bump only for package @apify/markdown





## [1.0.12](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.11...@apify/markdown@1.0.12) (2021-07-20)

**Note:** Version bump only for package @apify/markdown





## [1.0.11](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.10...@apify/markdown@1.0.11) (2021-07-19)


### Bug Fixes

* include SSH URL handling in repo name parser ([#237](https://github.com/apify/apify-shared-js/issues/237)) ([ffe4ad7](https://github.com/apify/apify-shared-js/commit/ffe4ad799c9ab5590ac8cb450dcb58f7a5e6102b))





## [1.0.10](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.9...@apify/markdown@1.0.10) (2021-07-19)

**Note:** Version bump only for package @apify/markdown





## [1.0.9](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.8...@apify/markdown@1.0.9) (2021-07-14)


### Bug Fixes

* replace git-url-parse with native method ([#231](https://github.com/apify/apify-shared-js/issues/231)) ([d7340f4](https://github.com/apify/apify-shared-js/commit/d7340f4b558f1a7ce234ec265a66b4ceef3ef2d0))





## [1.0.8](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.7...@apify/markdown@1.0.8) (2021-07-02)

**Note:** Version bump only for package @apify/markdown





## [1.0.7](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.6...@apify/markdown@1.0.7) (2021-06-28)

**Note:** Version bump only for package @apify/markdown





## [1.0.6](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.5...@apify/markdown@1.0.6) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





## [1.0.5](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.4...@apify/markdown@1.0.5) (2021-06-08)

**Note:** Version bump only for package @apify/markdown





## [1.0.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.3...@apify/markdown@1.0.4) (2021-06-07)

**Note:** Version bump only for package @apify/markdown





## [1.0.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.2...@apify/markdown@1.0.3) (2021-06-07)

**Note:** Version bump only for package @apify/markdown





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.1...@apify/markdown@1.0.2) (2021-06-03)

**Note:** Version bump only for package @apify/markdown





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.0...@apify/markdown@1.0.1) (2021-06-02)

**Note:** Version bump only for package @apify/markdown





# 1.0.0 (2021-05-28)


### Code Refactoring

* split into multiple packages + TS rewrite ([#137](https://github.com/apify/apify-shared-js/issues/137)) ([4a20c24](https://github.com/apify/apify-shared-js/commit/4a20c241edbaa697c337ab5e53dd7400fd3a6658)), closes [#131](https://github.com/apify/apify-shared-js/issues/131) [#95](https://github.com/apify/apify-shared-js/issues/95)


### BREAKING CHANGES

* - old `apify-shared` package is now gone in favour of new `@apify/*` packages
- all exports are now done via named exports instead of default exports (with exception of logger instance)
- removed `startsWith` polyfill and `newPromise` and `requestPromised` methods
