![Hyphen AI](logo.svg)

[![tests](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml/badge.svg)](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml)
[![npm](https://img.shields.io/npm/v/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![npm](https://img.shields.io/npm/dm/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![license](https://img.shields.io/github/license/Hyphen/nodejs-sdk)](https://github.com/hyphen/nodejs-sdk/blob/main/LICENSE)

# Hyphen Node.js SDK

The Hyphen Node.js SDK is a JavaScript library that allows developers to easily integrate Hyphen's feature flagging and experimentation capabilities into their Node.js applications. With this SDK, you can manage feature flags more effectively, enabling you to control the rollout of new features and conduct A/B testing with ease.

# Installation

To install the Hyphen Node.js SDK, you can use npm or yarn. Run the following command in your terminal:

```bash
npm install @hyphen/sdk
```

# Usage

There are many ways to use the Hyphen Node.js SDK. Because of this we have created examples for each of the different ways in each secton of the documentation.

# Toggle

[Toggle](https://hyphen.ai/toggle) is our feature flag service that allows you to control the rollout of new features to your users. You can access your feature flags using the `Toggle` class.

```javascript
import { Toggle, Context } from '@hyphen/sdk';

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
};

const context: Context = {
	targetingKey: 'user-123',
	ipAddress: '203.0.113.42',
	customAttributes: {
		subscriptionLevel: 'premium',
		region: 'us-east',
	},
	user: {
		id: 'user-123',
		email: 'john.doe@example.com',
		name: 'John Doe',
		customAttributes: {
			role: 'admin',
		},
	},
};

const toggle = new Toggle(toggleOptions);

//set the default context
toggle.setContext(context);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);

console.log('Boolean toggle value:', result); // true
```

## Toggle Options

| Option | Type | Description |
|----------------|----------------|----------------|
| `publicApiKey` | ` string` | The public API key for your Hyphen project. You can find this in the Hyphen dashboard. |
| `applicationId` | `string` | The application ID for your Hyphen project. You can find this in the Hyphen dashboard. |
| `environment?` | `string` | The environment for your Hyphen project such as `production`. Default uses `process.env.NODE_ENV`  |
| `context?` | `Context` | The context object that contains the user and custom attributes. This is optional. |
| `cache?` | `{ ttl: number}` | Whether to use the cache or not. |

## Toggle API


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