![Hyphen AI](logo.svg)

[![tests](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml/badge.svg)](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml)
[![npm](https://img.shields.io/npm/v/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![npm](https://img.shields.io/npm/dm/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![license](https://img.shields.io/github/license/Hyphen/nodejs-sdk)](https://github.com/hyphen/nodejs-sdk/blob/main/LICENSE)

Hyphen Node.js SDK


# Contributing

We welcome contributions to the Hyphen Node.js SDK! If you have an idea for a new feature, bug fix, or improvement, please follow these steps:

## Testing Your Changes

To test your changes locally you will need to create an account on [Hyphen](https://hyphen.ai) and do the following:
1. Create a new project in the Hyphen dashboard. This will give you a project ID and an Public API key.
2. On the project please add the following toggles:


| Name | Type | Value |
|----------------|----------------|----------------|
| hyphen-sdk-boolean | boolean | true |
| hyphen-sdk-number | number | 42 |
| hyphen-sdk-string | string | "Hyphen!" |
| hyphen-sdk-json | json | `{ "id": "Hello World!"}` |

Then, create a new application in the project. This will give you an application ID.

Once you have created the project, added the toggles, and created your application you can run the tests then create an `.env` file in the root of the project with the following content:


```bash
HYPHEN_PUBLIC_API_KEY=your_api_key
HYPHEN_APPLICATION_ID=your_project_id
```

Then run the tests with the following command:

```bash
pnpm i && pnpm test
```