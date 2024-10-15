# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@3.0.3...@apify/markdown@3.0.4) (2024-10-15)

**Note:** Version bump only for package @apify/markdown





## [3.0.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@3.0.2...@apify/markdown@3.0.3) (2024-10-02)

**Note:** Version bump only for package @apify/markdown





## [3.0.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@3.0.1...@apify/markdown@3.0.2) (2024-09-24)

**Note:** Version bump only for package @apify/markdown





## [3.0.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@3.0.0...@apify/markdown@3.0.1) (2024-08-07)

**Note:** Version bump only for package @apify/markdown





# [3.0.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.25...@apify/markdown@3.0.0) (2024-08-01)


### Bug Fixes

* **markdown:** upgrade dependency on `marked` to v13 ([#468](https://github.com/apify/apify-shared-js/issues/468)) ([d09775e](https://github.com/apify/apify-shared-js/commit/d09775ecfb9bc92de8d54623045dcbdb3518e0cf))


### BREAKING CHANGES

* **markdown:** Node 18 is required for `@apify/markdown` package, since `marked` added
this constraint too via `engines` field. The tests are still passing
even with node 14, so this is a rather artificial constraint.

Signature of `customHeadingRenderer` changed:

```diff
-customHeadingRenderer(text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string): string
+customHeadingRenderer({ depth, text, raw }: Tokens.Heading): string
```





## [2.1.25](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.24...@apify/markdown@2.1.25) (2024-08-01)

**Note:** Version bump only for package @apify/markdown





## [2.1.24](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.23...@apify/markdown@2.1.24) (2024-07-04)

**Note:** Version bump only for package @apify/markdown





## [2.1.23](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.22...@apify/markdown@2.1.23) (2024-07-01)

**Note:** Version bump only for package @apify/markdown





## [2.1.22](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.21...@apify/markdown@2.1.22) (2024-06-18)

**Note:** Version bump only for package @apify/markdown





## [2.1.21](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.20...@apify/markdown@2.1.21) (2024-05-06)

**Note:** Version bump only for package @apify/markdown





## [2.1.20](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.19...@apify/markdown@2.1.20) (2024-04-24)

**Note:** Version bump only for package @apify/markdown





## [2.1.19](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.18...@apify/markdown@2.1.19) (2024-01-25)

**Note:** Version bump only for package @apify/markdown





## [2.1.18](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.17...@apify/markdown@2.1.18) (2024-01-18)

**Note:** Version bump only for package @apify/markdown





## [2.1.17](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.16...@apify/markdown@2.1.17) (2024-01-15)


### Bug Fixes

* properly bundle to esm/cjs ([#430](https://github.com/apify/apify-shared-js/issues/430)) ([6775869](https://github.com/apify/apify-shared-js/commit/6775869d97d9006156a118044a66c4c0b644cb1f)), closes [#429](https://github.com/apify/apify-shared-js/issues/429)





## [2.1.16](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.15...@apify/markdown@2.1.16) (2024-01-12)

**Note:** Version bump only for package @apify/markdown





## [2.1.15](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.14...@apify/markdown@2.1.15) (2024-01-08)

**Note:** Version bump only for package @apify/markdown





## [2.1.14](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.13...@apify/markdown@2.1.14) (2024-01-03)

**Note:** Version bump only for package @apify/markdown





## [2.1.13](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.12...@apify/markdown@2.1.13) (2023-12-06)

**Note:** Version bump only for package @apify/markdown





## [2.1.12](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.11...@apify/markdown@2.1.12) (2023-10-06)

**Note:** Version bump only for package @apify/markdown





## [2.1.11](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.10...@apify/markdown@2.1.11) (2023-09-27)

**Note:** Version bump only for package @apify/markdown





## [2.1.10](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.9...@apify/markdown@2.1.10) (2023-09-13)

**Note:** Version bump only for package @apify/markdown





## [2.1.9](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.8...@apify/markdown@2.1.9) (2023-08-23)

**Note:** Version bump only for package @apify/markdown





## [2.1.8](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.7...@apify/markdown@2.1.8) (2023-08-10)

**Note:** Version bump only for package @apify/markdown





## [2.1.7](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.6...@apify/markdown@2.1.7) (2023-07-20)

**Note:** Version bump only for package @apify/markdown





## [2.1.6](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.5...@apify/markdown@2.1.6) (2023-07-17)

**Note:** Version bump only for package @apify/markdown





## [2.1.5](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.4...@apify/markdown@2.1.5) (2023-07-11)

**Note:** Version bump only for package @apify/markdown





## [2.1.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.3...@apify/markdown@2.1.4) (2023-07-02)

**Note:** Version bump only for package @apify/markdown





## [2.1.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.2...@apify/markdown@2.1.3) (2023-06-27)

**Note:** Version bump only for package @apify/markdown





## [2.1.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.1...@apify/markdown@2.1.2) (2023-06-16)

**Note:** Version bump only for package @apify/markdown





## [2.1.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.1.0...@apify/markdown@2.1.1) (2023-05-29)

**Note:** Version bump only for package @apify/markdown





# [2.1.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.34...@apify/markdown@2.1.0) (2023-05-29)


### Features

* **markdown:** add GraphQL ([#319](https://github.com/apify/apify-shared-js/issues/319)) ([a7405fe](https://github.com/apify/apify-shared-js/commit/a7405feb13ee85322a8154e9dd8a54de46e40dc4))





## [2.0.34](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.33...@apify/markdown@2.0.34) (2023-05-23)

**Note:** Version bump only for package @apify/markdown





## [2.0.33](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.32...@apify/markdown@2.0.33) (2023-05-23)

**Note:** Version bump only for package @apify/markdown





## [2.0.32](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.31...@apify/markdown@2.0.32) (2023-05-17)

**Note:** Version bump only for package @apify/markdown





## [2.0.31](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.30...@apify/markdown@2.0.31) (2023-05-17)

**Note:** Version bump only for package @apify/markdown





## [2.0.30](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.29...@apify/markdown@2.0.30) (2023-05-17)

**Note:** Version bump only for package @apify/markdown





## [2.0.29](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.28...@apify/markdown@2.0.29) (2023-05-10)

**Note:** Version bump only for package @apify/markdown





## [2.0.28](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.27...@apify/markdown@2.0.28) (2023-04-27)

**Note:** Version bump only for package @apify/markdown





## [2.0.27](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.26...@apify/markdown@2.0.27) (2023-04-24)

**Note:** Version bump only for package @apify/markdown





## [2.0.26](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.25...@apify/markdown@2.0.26) (2023-04-24)

**Note:** Version bump only for package @apify/markdown





## [2.0.25](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.24...@apify/markdown@2.0.25) (2023-04-14)

**Note:** Version bump only for package @apify/markdown





## [2.0.24](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.23...@apify/markdown@2.0.24) (2023-03-30)

**Note:** Version bump only for package @apify/markdown





## [2.0.23](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.22...@apify/markdown@2.0.23) (2023-03-29)

**Note:** Version bump only for package @apify/markdown





## [2.0.22](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.21...@apify/markdown@2.0.22) (2023-03-28)

**Note:** Version bump only for package @apify/markdown





## [2.0.21](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.20...@apify/markdown@2.0.21) (2023-03-20)

**Note:** Version bump only for package @apify/markdown





## [2.0.20](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.19...@apify/markdown@2.0.20) (2023-03-20)

**Note:** Version bump only for package @apify/markdown





## [2.0.19](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.18...@apify/markdown@2.0.19) (2023-03-15)

**Note:** Version bump only for package @apify/markdown





## [2.0.18](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.17...@apify/markdown@2.0.18) (2023-03-07)

**Note:** Version bump only for package @apify/markdown





## [2.0.17](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.16...@apify/markdown@2.0.17) (2023-02-13)

**Note:** Version bump only for package @apify/markdown





## [2.0.16](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.15...@apify/markdown@2.0.16) (2023-01-31)

**Note:** Version bump only for package @apify/markdown





## [2.0.15](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.14...@apify/markdown@2.0.15) (2022-12-21)

**Note:** Version bump only for package @apify/markdown





## [2.0.14](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.13...@apify/markdown@2.0.14) (2022-12-13)

**Note:** Version bump only for package @apify/markdown





## [2.0.13](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.12...@apify/markdown@2.0.13) (2022-12-01)

**Note:** Version bump only for package @apify/markdown





## [2.0.12](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.11...@apify/markdown@2.0.12) (2022-10-31)

**Note:** Version bump only for package @apify/markdown





## [2.0.11](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.10...@apify/markdown@2.0.11) (2022-10-12)


### Bug Fixes

* **markdown:** marked package named imports ([#345](https://github.com/apify/apify-shared-js/issues/345)) ([b874fb4](https://github.com/apify/apify-shared-js/commit/b874fb46704fc657335fcd3472b9d0a57fd8be4c))





## [2.0.10](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.9...@apify/markdown@2.0.10) (2022-10-07)

**Note:** Version bump only for package @apify/markdown





## [2.0.9](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.8...@apify/markdown@2.0.9) (2022-10-05)

**Note:** Version bump only for package @apify/markdown





## [2.0.8](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.7...@apify/markdown@2.0.8) (2022-09-29)

**Note:** Version bump only for package @apify/markdown





## [2.0.7](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.6...@apify/markdown@2.0.7) (2022-09-27)

**Note:** Version bump only for package @apify/markdown





## [2.0.6](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.5...@apify/markdown@2.0.6) (2022-09-05)

**Note:** Version bump only for package @apify/markdown





## [2.0.5](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.4...@apify/markdown@2.0.5) (2022-07-27)

**Note:** Version bump only for package @apify/markdown





## [2.0.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.3...@apify/markdown@2.0.4) (2022-07-26)

**Note:** Version bump only for package @apify/markdown





## [2.0.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.2...@apify/markdown@2.0.3) (2022-07-19)

**Note:** Version bump only for package @apify/markdown





## [2.0.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.1...@apify/markdown@2.0.2) (2022-07-04)

**Note:** Version bump only for package @apify/markdown





## [2.0.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@2.0.0...@apify/markdown@2.0.1) (2022-06-27)

**Note:** Version bump only for package @apify/markdown





# [2.0.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.3.0...@apify/markdown@2.0.0) (2022-06-21)


### Features

* dual (native) ESM/CJS support all the packages ([#312](https://github.com/apify/apify-shared-js/issues/312)) ([daf882e](https://github.com/apify/apify-shared-js/commit/daf882ecdb3ff5b75975b92fc3528802a53bc736))


### BREAKING CHANGES

* All packages now have dual ESM/CJS build and require node 14+.





# [1.3.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.6...@apify/markdown@1.3.0) (2022-06-20)


### Features

* **markdown:** add extra languages ([#313](https://github.com/apify/apify-shared-js/issues/313)) ([fc6bdc9](https://github.com/apify/apify-shared-js/commit/fc6bdc972ffc82be690134386136a5cf77655aef))





## [1.2.6](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.5...@apify/markdown@1.2.6) (2022-06-02)

**Note:** Version bump only for package @apify/markdown





## [1.2.5](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.4...@apify/markdown@1.2.5) (2022-05-31)

**Note:** Version bump only for package @apify/markdown





## [1.2.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.3...@apify/markdown@1.2.4) (2022-05-25)

**Note:** Version bump only for package @apify/markdown





## [1.2.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.2...@apify/markdown@1.2.3) (2022-05-19)

**Note:** Version bump only for package @apify/markdown





## [1.2.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.1...@apify/markdown@1.2.2) (2022-05-18)

**Note:** Version bump only for package @apify/markdown





## [1.2.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.2.0...@apify/markdown@1.2.1) (2022-05-10)

**Note:** Version bump only for package @apify/markdown





# [1.2.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.1.4...@apify/markdown@1.2.0) (2022-05-05)


### Features

* remove lowercasing from markdown hrefs ([#295](https://github.com/apify/apify-shared-js/issues/295)) ([36ee364](https://github.com/apify/apify-shared-js/commit/36ee364d67049612841ca934cace927f5d40650b))





## [1.1.4](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.1.3...@apify/markdown@1.1.4) (2022-04-26)

**Note:** Version bump only for package @apify/markdown





## [1.1.3](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.1.2...@apify/markdown@1.1.3) (2022-01-21)

**Note:** Version bump only for package @apify/markdown





## [1.1.2](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.1.1...@apify/markdown@1.1.2) (2022-01-21)


### Bug Fixes

* **web:** md to tab title for Javascript ([#278](https://github.com/apify/apify-shared-js/issues/278)) ([cdfe15f](https://github.com/apify/apify-shared-js/commit/cdfe15fccd98c180ab57034ab94f4420a4d72105))





## [1.1.1](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.1.0...@apify/markdown@1.1.1) (2022-01-21)

**Note:** Version bump only for package @apify/markdown





# [1.1.0](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.26...@apify/markdown@1.1.0) (2022-01-18)


### Features

* add lazy loading to markdown images ([#276](https://github.com/apify/apify-shared-js/issues/276)) ([92a89bc](https://github.com/apify/apify-shared-js/commit/92a89bca93f94423a94f5826b1816914a2e1cff6))





## [1.0.26](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.25...@apify/markdown@1.0.26) (2022-01-14)

**Note:** Version bump only for package @apify/markdown





## [1.0.25](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.24...@apify/markdown@1.0.25) (2022-01-11)

**Note:** Version bump only for package @apify/markdown





## [1.0.24](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.23...@apify/markdown@1.0.24) (2021-12-14)

**Note:** Version bump only for package @apify/markdown





## [1.0.23](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.22...@apify/markdown@1.0.23) (2021-11-15)

**Note:** Version bump only for package @apify/markdown





## [1.0.22](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.21...@apify/markdown@1.0.22) (2021-10-26)

**Note:** Version bump only for package @apify/markdown





## [1.0.21](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.20...@apify/markdown@1.0.21) (2021-10-12)

**Note:** Version bump only for package @apify/markdown





## [1.0.20](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.19...@apify/markdown@1.0.20) (2021-09-28)

**Note:** Version bump only for package @apify/markdown





## [1.0.19](https://github.com/apify/apify-shared-js/compare/@apify/markdown@1.0.18...@apify/markdown@1.0.19) (2021-09-13)

**Note:** Version bump only for package @apify/markdown





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
