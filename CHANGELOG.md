0.1.70 / 2020-02-05
===================
- Added "noopener noreferrer" to `markedSetNofollowLinks` in `utilities.client.js`

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
