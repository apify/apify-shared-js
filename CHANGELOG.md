0.7.7 / 2021/04/22
==================

- Added hubspot client

0.7.6 / 2021/04/14
==================

- Fix relative link rendering

0.7.5 / 2021/04/9
==================

- Fixes in relative link rendering

0.7.4 / 2021/04/9
==================

- Fixes in link rendering

0.7.3 / 2021/03/30
==================

- Fix isUrlRelative function placement - it was in the wrong file before.

0.7.2 / 2021/03/29
==================

- Add custom image and link rendering functions for Markdown

0.7.1 / 2021/03/26
==================

- Adding JOBS to the list of actor categories

0.7.0 / 2021/03/25
==================

- Adding new actor categories. This needs to be reflected in both app and web.

0.6.3 / 2021/03/05
==================

- Fix invalid published package structure.

0.6.2 / 2021/03/05
==================

- Added `ACTOR_RUN_RESURRECTED` to `WEBHOOK_EVENT_TYPES` constant

0.6.1 / 2021/02/27
==================

- Updated the list of Docker images with SDK v1 images. Deprecated old ones.

0.6.0 / 2021/02/11
==================

- Reworked custom heading renderer in `apifyMarked`
- Updated `marked` to 2.0.0 because of <https://github.com/advisories/GHSA-4r62-v4vq-hr96>

0.5.9 / 2021/02/04
==================

- Added `PROXY_STATUS_URL` environment variable to the constants file

0.5.8 / 2021/02/03
==================

- Updated packages dependencies
- Bump axios to 0.21.1 because <https://www.npmjs.com/advisories/1594>

0.5.7 / 2021/01/14
==================

- Updated function to convert relative image paths in git README files to absolute paths to support more URL formats

0.5.6 / 2020/12/10
==================

- Replaced `crypto` in favor of `create-hmac` in ImageProxyClient so it can be used in browsers as well

0.5.5 / 2020/12/08
==================

- Added new images with fixed version of Apify SDK

0.5.4 / 2020/11/24
==================

- Added function `deterministicUniqueId` for ID generation.

0.5.3 / 2020/11/24
==================

- Packages updated
- Code linted to match the new set of rules

0.5.2 / 2020/11/12
==================

- Replaced deprecated methods insert and remove of collection for mongoDb package

0.5.1 / 2020/10/27
==================

- Added function to convert relative URL paths in git README files to absolute paths

0.5.0 / 2020/10/02
==================

- Removed unused `getPublicCrawlerNiceUrl` function and its unlicensed dependency `slugg`.
- Removed `bluebird` dependency because it was not needed for anything.

0.4.6 / 2020/09/29
==================

- Improved custom code renderer to support default markdown fenced code block with explicitly specified language.

0.4.5 / 2020/09/09
==================

- Fixed custom code renderer to support the use case of rendering code tabs.

0.4.4 / 2020/09/01
==================

- Added custom code renderer to `marked` package

0.4.3 / 2020/08/19
==================

- Fixed getLeadByEmail with multiple leads in response

0.4.2 / 2020/08/18
==================

- Added methods createLead, createEvent, getLeadByEmail into salesforce client

0.4.1 / 2020/08/17
==================

- Moved Salesforce client from commons to shared

0.4.0 / 2020/06/04
==================

- Removed actor template constants in favor of
  [actor templates](https://github.com/apifytech/actor-templates)
  repository and package.

0.3.1 / 2020/06/03
===================

- Exported the `traverseObject()` function and extended the transformation
  function to enable also transformation of values

0.3.0 / 2020/05/26
===================

- Added `utils.makeInputJsFieldsReadable()`
- Dropped NodeJS v8 support

0.2.16 / 2020/05/18
===================

- Removed jsdom and jQuery dependencies from image proxy

0.2.15 / 2020/05/13
===================

- Added `HTTP_URL_REGEX` for better URL matching
- Added new constant with the default Apify platform limits

0.2.14 / 2020/05/05
===================

- Fixed extra whitespace in heading markdown renderer

0.2.13 / 2020/04/29
===================

- Added markdown heading renderer with custom ID support

0.2.12 / 2020/04/27
==================

- Added health checker

0.2.11 / 2020/04/08
==================

- Deprecated ACTOR_LOG_MAX_CHARS in favor of ACTOR_LIMITS.LOG_MAX_CHARS
- Fixed Babel configuration that was not working on iOS devices

0.2.10 / 2020/03/16
==================

- Removed `skipLevelInfo: true` from LoggerJson() to improve LogDNA filtering
- Added SPLIT_PATH_REGEX regex

0.2.9 / 2020-02-27
==================

- Added ACTOR_TEMPLATES

0.2.8 / 2020-02-18
==================

- Added EMAIL_REGEX_STR, added test for EMAIL_REGEX

0.2.7 / 2020-02-12
==================

- Increased node.js version in base images names.

0.2.6 / 2020-02-10
==================

- Added support for Meteor like errors with `reason` property.

0.2.5 / 2020-02-10
==================

- Returning `log.set|getLevel()` methods.

0.2.4 / 2020-02-10
==================

- Fixing logger problem when error doesn't have stack and using console.error() in text logger

0.2.3 / 2020-02-10
==================

- `skipTime` set to `true` by default for a text logger

0.2.2 / 2020-02-10
==================

- Final touches to new logger

0.2.1 / 2020-02-05
==================

- Fix in imports/exports of new logger + added `prepareLogLine` method to `LoggerJson`

0.2.0 / 2020-02-05
===================

- Logger completely rewritten to support colors, be extendable, ... .
  Logger API is compatible with the old one except the `log.internal()` where signature got changed, `logMethodCall|logMethodException()`
  were removed and initial configuration is different.
- Added support for `apifyProxyCountry` to input schema proxy field validation.

0.1.72 / 2020-02-06
===================

- Added statuses for marketplace projects and marketplace user role names to `consts.js`

0.1.71 / 2020-02-06
===================

- Just republishing v0.1.x as latest

0.1.70 / 2020-02-05
===================

- Added "noopener noreferrer" to `markedSetNofollowLinks` in `utilities.client.js`
- Removed Meteor.js related methods and code from the logger

0.1.69 / 2020-01-22
===================

- Added RUN_MEMORY_MBYTES_PER_CPU_CORE constant

0.1.68 / 2019-12-23
===================

- Better error messages for input schema regex errors

0.1.67 / 2019-10-15
===================

- Added stream utilities with readStreamToString() from @apify/http-request

0.1.66 / 2019-10-02
===================

- Added sectionCaption and sectionDescription to string enum input schema field

0.1.65 / 2019-10-02
===================

- Fixed imageProxyClient.updateImagesInHtml() function

0.1.64 / 2019-09-25
===================

- Fixed missing variables in input schema validation messages

0.1.63 / 2019-09-25
===================

- Added validateInputSchema function to validate input schema with user friendly messages

0.1.62 / 2019-09-18
===================

- Added new function to ImageProxyClient

0.1.61 / 2019-09-18
===================

- Added MAX_MULTIFILE_BYTES and SOURCE_FILE_FORMATS to consts.

0.1.60 / 2019-09-16
===================

- Added actor name constraints const

0.1.59 / 2019-09-11
===================

- Updated `secretKey` option to `hmacKey` for image proxy client

0.1.58 / 2019-09-10
===================

- Added client to generate URL for Apify image proxy

0.1.57 / 2019-08-22
===================

- Moved `splitFullName` function from `utilities.js` to `utilities.client.js`

0.1.56 / 2019-07-30
===================

- Added `sectionCaption` and `sectionDescription` as available properties for each input type in `INPUT_SCHEMA.json`

0.1.55 / 2019-07-18
===================

- Removed `SPORTS` and `UTILS` from `ACTOR_CATEGORIES`

0.1.54 / 2019-07-16
===================

- Updated labels in ACTOR_CATEGORIES

0.1.53 / 2019-07-15
===================

- Added python editor to input schema

0.1.52 / 2019-07-04
===================

- _traverseObject() function used in unescapeFromBson() skips buffers.

0.1.51 / 2019-05-16
===================

- Add support of dot notation (`resource.id`) to `WebhookPayloadTemplate`.

0.1.50 / 2019-05-16
===================

- Fix `WebhookPayloadTemplateError` `captureStackTrace` error in environments without support.

0.1.49 / 2019-05-16
===================

- Refactor `WebhookPayloadTemplate` to disregard JSON.parse error messages in parsing.

0.1.48 / 2019-05-15
===================

- Added `WEBHOOK_DEFAULT_PAYLOAD_TEMPLATE` and `WEBHOOK_ALLOWED_PAYLOAD_VARIABLES` to consts.

0.1.47 / 2019-05-15
===================

- Added `InvalidJsonError` and `InvalidVariableError` to `WebhookPayloadTemplate`.

0.1.46 / 2019-05-14
===================

- Added `APIFY_UI_CLIENT_KEY` constant

0.1.45 / 2019-05-14
===================

- Fixed exponential backoff to include error in warning logs

0.1.44 / 2019-05-09
===================

- Renamed `JsonToken` to `JsonVariable`.

0.1.43 / 2019-05-07
===================

- Added `jsonStringifyExtended()` and `JsonToken` class to client utils.

0.1.42 / 2019-04-17
===================

- Added input field definition allowing to create a field of any type with editor "json" or "hidden".
- Changed `./publish.sh` script to work with master only, we don't support develop branch any more.
