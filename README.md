![Hyphen AI](https://github.com/Hyphen/nodejs-sdk/raw/main/logo.svg)

[![tests](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml/badge.svg)](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml)
[![npm](https://img.shields.io/npm/v/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![npm](https://img.shields.io/npm/dm/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![license](https://img.shields.io/github/license/Hyphen/nodejs-sdk)](https://github.com/hyphen/nodejs-sdk/blob/main/LICENSE)

# Hyphen Node.js SDK

The Hyphen Node.js SDK is a JavaScript library that allows developers to easily integrate Hyphen's feature flagging and experimentation capabilities into their Node.js applications. With this SDK, you can manage feature flags more effectively, enabling you to control the rollout of new features and conduct A/B testing with ease.

# Table of Contents
- [Hyphen Node.js SDK](#hyphen-nodejs-sdk)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Toggle](#toggle)
	- [Toggle Options](#toggle-options)
	- [Toggle API](#toggle-api)
	- [Toggle Hooks](#toggle-hooks)
	- [Toggle Error Handling](#toggle-error-handling)
- [Contributing](#contributing)
- [Testing Your Changes](#testing-your-changes)
- [License and Copyright](#license-and-copyright)

# Installation

To install the Hyphen Node.js SDK, you can use npm or yarn. Run the following command in your terminal:

```bash
npm install @hyphen/sdk
```

# Basic Usage

There are many ways to use the Hyphen Node.js SDK. Because of this we have created examples for each of the different ways in each secton of the documentation.

# Toggle

[Toggle](https://hyphen.ai/toggle) is our feature flag service that allows you to control the rollout of new features to your users. You can access your feature flags using the `Toggle` class.

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
};

const toggle = new Toggle(toggleOptions);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);

console.log('Boolean toggle value:', result); // true
```

if you want to set the context you can do it like this:

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
};

const toggle = new Toggle(toggleOptions);

toggle.setContext(context);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);

console.log('Boolean toggle value:', result); // true
```

if you would like to override the context for a single request you can do it like this:

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
};

const overrideContext: ToggleContext = {
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

const result = await toggle.getBoolean('hyphen-sdk-boolean', false, { context: overrideContext });

console.log('Boolean toggle value:', result); // true
```

## Toggle Options

| Option | Type | Description |
|----------------|----------------|----------------|
| *publicApiKey* | ` string` | The public API key for your Hyphen project. You can find this in the Hyphen dashboard. |
| *applicationId* | `string` | The application ID for your Hyphen project. You can find this in the Hyphen dashboard. |
| *environment?* | `string` | The environment for your Hyphen project such as `production`. Default uses `process.env.NODE_ENV`  |
| *context?* | `ToggleContext` | The context object that contains the user and custom attributes. This is optional. |
| *cache?* | `{ ttl: number}` | Whether to use the cache or not. |

## Toggle API

| Method | Parameters | Description |
|----------------|----------------|----------------|
| *setContext* | `context: ToggleContext` | Set the context for the toggle. This is optional. |
| *get<Type>* | `key: string, defaultValue: T, options?: ToggleRequestOptions` | Get the value of a toggle. This is a generic method that can be used to get any type from toggle. |
| *getBoolean* | `key: string, defaultValue: boolean, options?: ToggleRequestOptions` | Get the value of a boolean toggle. |
| *getNumber* | `key: string, defaultValue: number, options?: ToggleRequestOptions` | Get the value of a number toggle. |
| *getString* | `key: string, defaultValue: string, options?: ToggleRequestOptions` | Get the value of a string toggle. |
| *getObject<Type>* | `key: string, defaultValue: any, options?: ToggleRequestOptions` | Get the value of a object toggle. |

## Toggle Hooks

The following hooks are available for Toggle:
| Hook | object | Description |
|----------------|----------------|----------------|
| *beforeGetBoolean* | `{ key: string, defaultValue:boolean, options?: ToggleRequestOptions }` | Called before the boolean toggle is fetched. |
| *afterGetBoolean* | `{ key: string, defaultValue:boolean, options?: ToggleRequestOptions, result: boolean }` | Called after the boolean toggle is fetched. |
| *beforeGetNumber* | `{ key: string, defaultValue:number, options?: ToggleRequestOptions }` | Called before the number toggle is fetched. |
| *afterGetNumber* | `{ key: string, defaultValue:number, options?: ToggleRequestOptions, result: number }` | Called after the number toggle is fetched. |
| *beforeGetString* | `{ key: string, defaultValue:string, options?: ToggleRequestOptions }` | Called before the string toggle is fetched. |
| *afterGetString* | `{ key: string, defaultValue:string, options?: ToggleRequestOptions, result: string }` | Called after the string toggle is fetched. |
| *beforeGetObject* | `{ key: string, defaultValue:any, options?: ToggleRequestOptions }` | Called before the object toggle is fetched. |
| *afterGetObject* | `{ key: string, defaultValue:any, options?: ToggleRequestOptions, result: any }` | Called after the object toggle is fetched. |

You can use the hooks to modify the request or the response. For example, you can use the `beforeGetBoolean` hook to log the request before it is sent to the server.

```javascript
import { Toggle, ToggleHooks, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
};

const toggle = new Toggle(toggleOptions);

toggle.onHook(ToggleHooks.beforeGetBoolean, (data) => {
  console.log('Before get boolean toggle:', data); // { key: 'hyphen-sdk-boolean', defaultValue: false }
});

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);

console.log('Boolean toggle value:', result); // true
```

## Toggle Error Handling

The SDK provides a way to handle errors that occur during the toggle request. You can use the `.on` method to handle errors globally.

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
};

const toggle = new Toggle(toggleOptions);
toggle.on('error', (error) => {
  console.error('Error fetching toggle:', error);
});

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

If you would like to have the errors thrown you can use the `throwErrors` option in the constructor:

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
  throwErrors: true,
};

const toggle = new Toggle(toggleOptions);

try {
  const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
  console.log('Boolean toggle value:', result); // true
} catch (error) {
  console.error('Error fetching toggle:', error);
}
```

## Toggle Self-Hosted

Toggle uses [Horizon](https://hyphen.ai/horizon) to fetch the feature flags. If you are using a self-hosted version of Hyphen you can use the `uris` option in the constructor to set the url of your self-hosted version:

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
  uris: [
	'https://your-self-hosted-horizon-url',
  ],
};

const toggle = new Toggle(toggleOptions);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

If you want to use your self-hosted version of [Horizon](https://hyphen.ai/horizon) as a primary and fallback to our hosted version you can do it like this:

```javascript
import { Toggle, ToggleContext } from '@hyphen/sdk';

const context: ToggleContext = {
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

const toggleOptions = {
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
  context: context,
  uris: [
	'https://your-self-hosted-horizon-url',
	'https://toggle.hyphen.cloud',
  ],
};

const toggle = new Toggle(toggleOptions);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

# Contributing

We welcome contributions to the Hyphen Node.js SDK! If you have an idea for a new feature, bug fix, or improvement, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Install `pnpm` by running `npm install -g pnpm` if you don't have it already.
3. Run the installation and tests to ensure everything is working correctly `pnpm i && pnpm test`. 
4. Make your changes and commit them with a clear message. In the following format:
   - `feat: <describe the feature>`
   - `fix: <describe the bug fix>`
   - `chore: updgrading xxx to version x.x.x`

5. Push your changes to your forked repository.
6. Create a pull request to the main repository.
7. Describe your changes and why they are necessary.

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

# License and Copyright
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
The copyright for this project is held by Hyphen, Inc. All rights reserved.