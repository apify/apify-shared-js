# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.1](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.3.0...@apify/actor-memory-expression@1.0.1) (2026-09-03)


### Bug Fixes

* graduate remaining 0.x packages to v1 ([#700](https://github.com/apify/apify-shared-js/issues/700)) ([1d754fa](https://github.com/apify/apify-shared-js/commit/1d754faa579c748be9f1a0da7bf0c325e42858d8))





# [0.3.0](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.16...@apify/actor-memory-expression@0.3.0) (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))
* publish ESM-only packages and require Node.js 22+ ([#684](https://github.com/apify/apify-shared-js/issues/684)) ([338dbac](https://github.com/apify/apify-shared-js/commit/338dbac5df0cd7a991e06c747bb82af9aec562a6))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
* All packages are ESM-only and require Node.js 22 or higher. CommonJS consumers on Node.js 22+ can still require() them thanks to native require(esm) support.





## [0.2.16](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.15...@apify/actor-memory-expression@0.2.16) (2026-09-02)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.15](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.14...@apify/actor-memory-expression@0.2.15) (2026-08-25)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.14](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.13...@apify/actor-memory-expression@0.2.14) (2026-08-24)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.13](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.12...@apify/actor-memory-expression@0.2.13) (2026-08-21)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.12](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.11...@apify/actor-memory-expression@0.2.12) (2026-08-20)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.11](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.10...@apify/actor-memory-expression@0.2.11) (2026-08-18)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.10](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.9...@apify/actor-memory-expression@0.2.10) (2026-08-03)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.9](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.8...@apify/actor-memory-expression@0.2.9) (2026-07-30)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.8](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.7...@apify/actor-memory-expression@0.2.8) (2026-07-30)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.7](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.6...@apify/actor-memory-expression@0.2.7) (2026-07-29)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.6](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.5...@apify/actor-memory-expression@0.2.6) (2026-07-21)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.5](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.4...@apify/actor-memory-expression@0.2.5) (2026-07-21)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.4](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.3...@apify/actor-memory-expression@0.2.4) (2026-07-20)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.3](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.2...@apify/actor-memory-expression@0.2.3) (2026-07-16)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.2](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.1...@apify/actor-memory-expression@0.2.2) (2026-07-16)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.2.1](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.2.0...@apify/actor-memory-expression@0.2.1) (2026-07-09)

**Note:** Version bump only for package @apify/actor-memory-expression





# [0.2.0](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.18...@apify/actor-memory-expression@0.2.0) (2026-07-03)


### Bug Fixes

* **ci:** Add GH_TOKEN env variable to workflow using the GitHub CLI, revert previous version bump ([#663](https://github.com/apify/apify-shared-js/issues/663)) ([f4315ba](https://github.com/apify/apify-shared-js/commit/f4315ba6bec17fa1a54eaa49a93c89d1500a7ad9))
* **ci:** Use long commit SHA when creating git tags during new release, revert previous version bump ([#664](https://github.com/apify/apify-shared-js/issues/664)) ([effe553](https://github.com/apify/apify-shared-js/commit/effe553d042cccc26c99b83e2ac15ade1531b865))


### Features

* memory expression allow comparing text ([#661](https://github.com/apify/apify-shared-js/issues/661)) ([7cb3fbf](https://github.com/apify/apify-shared-js/commit/7cb3fbffcdb2eb62de47f7d64cbe95f738a81ebb)), closes [#660](https://github.com/apify/apify-shared-js/issues/660)





## [0.1.18](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.17...@apify/actor-memory-expression@0.1.18) (2026-06-03)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.17](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.16...@apify/actor-memory-expression@0.1.17) (2026-05-22)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.16](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.15...@apify/actor-memory-expression@0.1.16) (2026-05-04)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.15](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.14...@apify/actor-memory-expression@0.1.15) (2026-04-30)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.14](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.13...@apify/actor-memory-expression@0.1.14) (2026-04-29)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.13](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.12...@apify/actor-memory-expression@0.1.13) (2026-04-29)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.12](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.11...@apify/actor-memory-expression@0.1.12) (2026-04-15)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.11](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.10...@apify/actor-memory-expression@0.1.11) (2026-04-14)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.10](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.9...@apify/actor-memory-expression@0.1.10) (2026-03-31)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.9](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.8...@apify/actor-memory-expression@0.1.9) (2026-02-26)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.8](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.7...@apify/actor-memory-expression@0.1.8) (2026-02-13)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.7](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.6...@apify/actor-memory-expression@0.1.7) (2026-02-09)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.6](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.5...@apify/actor-memory-expression@0.1.6) (2026-02-02)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.5](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.4...@apify/actor-memory-expression@0.1.5) (2026-01-27)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.4](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.3...@apify/actor-memory-expression@0.1.4) (2026-01-20)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.3](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.2...@apify/actor-memory-expression@0.1.3) (2025-11-27)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.2](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.1...@apify/actor-memory-expression@0.1.2) (2025-11-27)

**Note:** Version bump only for package @apify/actor-memory-expression





## [0.1.1](https://github.com/apify/apify-shared-js/compare/@apify/actor-memory-expression@0.1.0...@apify/actor-memory-expression@0.1.1) (2025-11-27)

**Note:** Version bump only for package @apify/actor-memory-expression





# 0.1.0 (2025-11-25)


### Features

* add function to calculate dynamic default Actor memory ([#570](https://github.com/apify/apify-shared-js/issues/570)) ([f3a97bf](https://github.com/apify/apify-shared-js/commit/f3a97bf86b14cc548c958a21a75720e4e4724b65))
