# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.4.2...@apify/consts@1.5.0) (2021-12-14)


### Features

* Added new actor store categories ([#271](https://github.com/apify/apify-shared-js/issues/271)) ([8b50716](https://github.com/apify/apify-shared-js/commit/8b50716cc3301411d94ef01c711ff515d5d6b152))





## [1.4.2](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.4.1...@apify/consts@1.4.2) (2021-11-15)

**Note:** Version bump only for package @apify/consts





## [1.4.1](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.4.0...@apify/consts@1.4.1) (2021-10-26)


### Bug Fixes

* use const assertions for object constants ([b91bd72](https://github.com/apify/apify-shared-js/commit/b91bd72be48c6f3e795211643212226dbb37e0b0))





# [1.4.0](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.3.0...@apify/consts@1.4.0) (2021-09-28)


### Features

* add workflow key env variable ([#255](https://github.com/apify/apify-shared-js/issues/255)) ([d3ec398](https://github.com/apify/apify-shared-js/commit/d3ec39884076faf7be4d2c3b3ab1c9d8d82c94a2))





# [1.3.0](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.2.0...@apify/consts@1.3.0) (2021-08-26)


### Features

* Add APIFY_DISABLE_OUTDATED_WARNING to available env vars in consts ([#249](https://github.com/apify/apify-shared-js/issues/249)) ([741727a](https://github.com/apify/apify-shared-js/commit/741727a37584568d6b8a47822ec61f08e2ec0433))





# [1.2.0](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.1.3...@apify/consts@1.2.0) (2021-08-16)


### Features

* add APIFY_API_PUBLIC_BASE_URL ([#244](https://github.com/apify/apify-shared-js/issues/244)) ([3ca39b4](https://github.com/apify/apify-shared-js/commit/3ca39b46c9d66e9e8b564ebb32b74077b9962932))





## [1.1.3](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.1.2...@apify/consts@1.1.3) (2021-06-18)


### Bug Fixes

* remove ESM support ([#199](https://github.com/apify/apify-shared-js/issues/199)) ([c9252e3](https://github.com/apify/apify-shared-js/commit/c9252e326923d6cbb568a474b78d046380cba119))





## [1.1.2](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.1.1...@apify/consts@1.1.2) (2021-06-08)

**Note:** Version bump only for package @apify/consts





## [1.1.1](https://github.com/apify/apify-shared-js/compare/@apify/consts@1.1.0...@apify/consts@1.1.1) (2021-06-07)

**Note:** Version bump only for package @apify/consts





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
