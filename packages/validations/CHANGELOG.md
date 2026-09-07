# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/validations@1.0.2...@apify/validations@1.1.0) (2026-09-07)


### Features

* **validations:** adopt the richer error formatting from apify-client ([#703](https://github.com/apify/apify-shared-js/issues/703)) ([cf69060](https://github.com/apify/apify-shared-js/commit/cf69060105edd62edd49acc61388a295ef1a5d65))





## [1.0.2](https://github.com/apify/apify-shared-js/compare/@apify/validations@1.0.1...@apify/validations@1.0.2) (2026-09-07)

**Note:** Version bump only for package @apify/validations





## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/validations@0.1.0...@apify/validations@1.0.1) (2026-09-03)


### Bug Fixes

* graduate remaining 0.x packages to v1 ([#700](https://github.com/apify/apify-shared-js/issues/700)) ([1d754fa](https://github.com/apify/apify-shared-js/commit/1d754faa579c748be9f1a0da7bf0c325e42858d8))





# 0.1.0 (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
