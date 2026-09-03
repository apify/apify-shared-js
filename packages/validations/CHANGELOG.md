# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/validations@0.1.0...@apify/validations@1.0.1) (2026-09-03)


### Bug Fixes

* graduate remaining 0.x packages to v1 ([#700](https://github.com/apify/apify-shared-js/issues/700)) ([1d754fa](https://github.com/apify/apify-shared-js/commit/1d754faa579c748be9f1a0da7bf0c325e42858d8))





# 0.1.0 (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
