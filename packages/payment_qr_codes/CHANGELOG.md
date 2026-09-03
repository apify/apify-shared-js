# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.2.3...@apify/payment_qr_codes@0.3.0) (2026-09-03)


### Features

* **input_secrets:** replace ow with zod validation ([#685](https://github.com/apify/apify-shared-js/issues/685)) ([38a6890](https://github.com/apify/apify-shared-js/commit/38a6890fd724743b7c07c752766c69f47a1f7694))
* **payment_qr_codes:** generate QR codes with etiket instead of qrcode ([#692](https://github.com/apify/apify-shared-js/issues/692)) ([e7d2edb](https://github.com/apify/apify-shared-js/commit/e7d2edbcb9909ca119c19fad5131b909896597d9))
* publish ESM-only packages and require Node.js 22+ ([#684](https://github.com/apify/apify-shared-js/issues/684)) ([338dbac](https://github.com/apify/apify-shared-js/commit/338dbac5df0cd7a991e06c747bb82af9aec562a6))


### BREAKING CHANGES

* **input_secrets:** Invalid arguments throw ArgumentValidationError instead of ow's ArgumentError, with differently formatted messages.
* All packages are ESM-only and require Node.js 22 or higher. CommonJS consumers on Node.js 22+ can still require() them thanks to native require(esm) support.





## [0.2.3](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.2.2...@apify/payment_qr_codes@0.2.3) (2026-09-02)

**Note:** Version bump only for package @apify/payment_qr_codes





## [0.2.2](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.2.1...@apify/payment_qr_codes@0.2.2) (2026-04-29)

**Note:** Version bump only for package @apify/payment_qr_codes





## [0.2.1](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.2.0...@apify/payment_qr_codes@0.2.1) (2024-01-15)


### Bug Fixes

* properly bundle to esm/cjs ([#430](https://github.com/apify/apify-shared-js/issues/430)) ([6775869](https://github.com/apify/apify-shared-js/commit/6775869d97d9006156a118044a66c4c0b644cb1f)), closes [#429](https://github.com/apify/apify-shared-js/issues/429)





# [0.2.0](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.1.1...@apify/payment_qr_codes@0.2.0) (2022-06-21)


### Features

* dual (native) ESM/CJS support all the packages ([#312](https://github.com/apify/apify-shared-js/issues/312)) ([daf882e](https://github.com/apify/apify-shared-js/commit/daf882ecdb3ff5b75975b92fc3528802a53bc736))


### BREAKING CHANGES

* All packages now have dual ESM/CJS build and require node 14+.





## [0.1.1](https://github.com/apify/apify-shared-js/compare/@apify/payment_qr_codes@0.1.0...@apify/payment_qr_codes@0.1.1) (2022-01-14)

**Note:** Version bump only for package @apify/payment_qr_codes





# 0.1.0 (2021-08-18)


### Features

* Generating CZK payment QR code ([#245](https://github.com/apify/apify-shared-js/issues/245)) ([a6aae33](https://github.com/apify/apify-shared-js/commit/a6aae33dd893036967be7616cf797e9bd833237f))
