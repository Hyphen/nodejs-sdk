![Hyphen AI](https://github.com/Hyphen/nodejs-sdk/raw/main/logo.png)

[![tests](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml/badge.svg)](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml)
[![npm](https://img.shields.io/npm/v/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![npm](https://img.shields.io/npm/dm/@hyphen/sdk)](https://www.npmjs.com/package/@hyphen/sdk)
[![license](https://img.shields.io/github/license/Hyphen/nodejs-sdk)](https://github.com/hyphen/nodejs-sdk/blob/main/LICENSE)

# Hyphen Node.js SDK

The Hyphen Node.js SDK is a JavaScript library that allows developers to easily integrate Hyphen's feature flag service [Toggle](https://hyphen.ai/toggle), secret management service [ENV](https://hyphen.ai/env), and geo information service [Net Info](https://hyphen.ai/net-info) into their Node.js applications.

# Table of Contents
- [Installation](#installation)
- [Basic Usage with Hyphen](#basic-usage-with-hyphen)
- [Toggle - Feature Flag Service](#toggle---feature-flag-service)
	- [Toggle Options](#toggle-options)
	- [Toggle API](#toggle-api)
	- [Toggle Hooks](#toggle-hooks)
	- [Toggle Error Handling](#toggle-error-handling)
	- [Toggle Caching](#toggle-caching)
	- [Toggle Environment Variables](#toggle-environment-variables)
	- [Toggle Self-Hosted](#toggle-self-hosted)
- [ENV - Secret Management Service](#env---secret-management-service)
	- [Loading Environment Variables](#loading-environment-variables)
- [Net Info - Geo Information Service](#net-info---geo-information-service)
- [Link - Short Code Service](#link---short-code-service)
	- [Creating a Short Code](#creating-a-short-code)
	- [Updating a Short Code](#updating-a-short-code)
	- [Getting a Short Code](#getting-a-short-code)
	- [Getting Short Codes](#getting-short-codes)
	- [Deleting a Short Code](#deleting-a-short-code)
- [Contributing](#contributing)
- [Testing Your Changes](#testing-your-changes)
- [License and Copyright](#license-and-copyright)

# Installation

To install the Hyphen Node.js SDK, you can use npm or yarn. Run the following command in your terminal:

```bash
npm install @hyphen/sdk
```

# Basic Usage with Hyphen

There are many ways to use the Hyphen Node.js SDK. Because of this we have created examples for each of the different ways in each secton of the documentation. To get started, you can create an instance of the `Hyphen` class and use its methods to interact with the various services.

```javascript
import { Hyphen } from '@hyphen/sdk';

const hyphen = new Hyphen({
	publicApiKey: 'your_public_api_key',
	applicationId: 'your_application_id',
});
const result = await hyphen.toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

You can also use `netInfo` to access the network information service.

```javascript
import { Hyphen, ToggleContext } from '@hyphen/sdk';

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

const hyphen = new Hyphen({
	publicApiKey: 'your_public_api_key',
	toggle: {
		applicationId: 'your_application_id',
		context: context,
	},
});
const result = await hyphen.toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

You can also use `netInfo` to access the network information service.

```javascript
import { Hyphen } from '@hyphen/sdk';

const hyphen = new Hyphen({
	apiKey: 'your_api_key',
});
const result = await hyphen.netInfo.getIpInfo('8.8.8.8');
console.log('Geo IP information:', result);
```

If you need to set the `apiKey` or `publicApiKey` after initializing `Hyphen` you can do so and it will cascade the setting to the individual services:

```javascript
import { Hyphen } from '@hyphen/sdk';

const hyphen = new Hyphen();
hyphen.apiKey = 'your_api_key';
const result = await hyphen.netInfo.getIpInfo('8.8.8.8');
console.log('Geo IP information:', result);
```

Finally, `error`, `warn`, and `info` emitters are enabled from each of the services and you can access them by doing the following example with `error`:

```javascript
import { Hyphen } from '@hyphen/sdk';

const hyphen = new Hyphen({ apiKey: 'your_api_key'});

hyphen.on('error', (error) => {
	console.log(error);
});

const result = await hyphen.netInfo.getIpInfo('8.8.8.8');
console.log('Geo IP information:', result);
```

The rest of the examples for each service show you accessing the service instance directly. 

# Toggle - Feature Flag Service

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
| *caching?* | `{ ttl: number, generateCacheKeyFn: (context?: ToggleContext) => string}` | Whether to use the cache or not and a function to set the key. The `ttl` is in seconds |

## Toggle API

| Method | Parameters | Description |
|----------------|----------------|----------------|
| *setContext* | `context: ToggleContext` | Set the context for the toggle. This is optional. |
| *get<Type>* | `key: string, defaultValue: T, options?: ToggleGetOptions` | Get the value of a toggle. This is a generic method that can be used to get any type from toggle. |
| *getBoolean* | `key: string, defaultValue: boolean, options?: ToggleGetOptions` | Get the value of a boolean toggle. |
| *getNumber* | `key: string, defaultValue: number, options?: ToggleGetOptions` | Get the value of a number toggle. |
| *getString* | `key: string, defaultValue: string, options?: ToggleGetOptions` | Get the value of a string toggle. |
| *getObject<Type>* | `key: string, defaultValue: any, options?: ToggleGetOptions` | Get the value of a object toggle. |

## Toggle Hooks

The following hooks are available for Toggle:
| Hook | object | Description |
|----------------|----------------|----------------|
| *beforeGetBoolean* | `{ key: string, defaultValue:boolean, options?: ToggleGetOptions }` | Called before the boolean toggle is fetched. |
| *afterGetBoolean* | `{ key: string, defaultValue:boolean, options?: ToggleGetOptions, result: boolean }` | Called after the boolean toggle is fetched. |
| *beforeGetNumber* | `{ key: string, defaultValue:number, options?: ToggleGetOptions }` | Called before the number toggle is fetched. |
| *afterGetNumber* | `{ key: string, defaultValue:number, options?: ToggleGetOptions, result: number }` | Called after the number toggle is fetched. |
| *beforeGetString* | `{ key: string, defaultValue:string, options?: ToggleGetOptions }` | Called before the string toggle is fetched. |
| *afterGetString* | `{ key: string, defaultValue:string, options?: ToggleGetOptions, result: string }` | Called after the string toggle is fetched. |
| *beforeGetObject* | `{ key: string, defaultValue:any, options?: ToggleGetOptions }` | Called before the object toggle is fetched. |
| *afterGetObject* | `{ key: string, defaultValue:any, options?: ToggleGetOptions, result: any }` | Called after the object toggle is fetched. |

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

## Toggle Caching
The SDK supports caching of toggle values to improve performance and reduce the number of requests made to the server. You can enable caching by providing a `caching` option in the constructor.

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
  caching: {
	ttl: 60, // Cache for 60 seconds
};

const toggle = new Toggle(toggleOptions);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

If you want to use a custom cache key generation function, you can provide a `generateCacheKeyFn` function in the `caching` option:

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
  caching: {
	ttl: 60, // Cache for 60 seconds
	generateCacheKeyFn: (context) => {
		return `toggle-${context?.targetingKey || 'default'}-hyphen-sdk-boolean`;
	},
  },
};

const toggle = new Toggle(toggleOptions);

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);
console.log('Boolean toggle value:', result); // true
```

# Toggle Environment Variables

You can also use environment variables to set the `publicApiKey` and `applicationId`. This is useful for keeping your API keys secure and not hardcoding them in your code. To do this just set your `.env` file with the following variables:

```bash
HYPHEN_PUBLIC_API_KEY=your_public_api_key
HYPHEN_APPLICATION_ID=your_application_id
```

On initialization of the `Toggle` class, the SDK will automatically check for these environment variables and use them if they are set. If they are not set, you will need to provide them in the constructor.

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

# ENV - Secret Management Service

Hyphens secret management service known as [ENV](https://hyphen.ai/env) allows you to manage your environment variables in a secure way. The Hyphen Node.js SDK provides a simple way to access your environment variables.

## Loading Environment Variables
To load your environment variables, you can use the `loadEnv` function from the SDK. This function will automatically load your environment variables from the `.env` file and then override them with the environment based environment file if it exists (ex: `.env.development`). This is useful for managing different environments such as development, staging, and production. 

The following override path is:
```
.env -> .env.local -> .env.<environment> -> .env.<environment>.local
```

Here is an example of how to use the `loadEnv` function:

```javascript
import { loadEnv } from '@hyphen/sdk';

//load your default environment variables and envrionment variables
loadEnv();
```

If your environment variables are not stored in the root of your project you can specify the path to your `.env` file:

```javascript
import { loadEnv } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
loadEnv({ path: '/path/to/your/env/files/' });
```

You can also specify the environment variables to load by passing an array of variable names:

```javascript
import { loadEnv } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
loadEnv({ environment: 'development' });
```

if you want to turn off the local environment variables you can do it like this:

```javascript
import { loadEnv } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
loadEnv({ local: false });
```

# Net Info - Geo Information Service

The Hyphen Node.js SDK also provides a `NetInfo` class that allows you to fetch geo information about an IP address. This can be useful for debugging or logging purposes. You can read more about it:

* [Website](https://hyphen.ai/net-info)
* [https://net.info](https://net.info) - webservice uri used by the SDK
* [Quick Start Guide](https://docs.hyphen.ai/docs/netinfo-quickstart)

To use the `NetInfo` class, you can do the following:

```javascript
import { NetInfo } from '@hyphen/sdk';
const netInfo = new NetInfo({
  apiKey: 'your_api_key',
});

const ipInfo = await netInfo.getIpInfo('8.8.8.8');
console.log('IP Info:', ipInfo);
```

If you want to fetch information for multiple IP addresses, you can do it like this:

```javascript
import { NetInfo } from '@hyphen/sdk';
const netInfo = new NetInfo({
  apiKey: 'your_api_key',
});
const ips = ['8.8.8.8', '1.1.1.1'];
const ipInfos = await netInfo.getIpInfos(ips);
console.log('IP Infos:', ipInfos);
```

You can also set the API key using the `HYPHEN_API_KEY` environment variable. This is useful for keeping your API key secure and not hardcoding it in your code.

# Link - Short Code Service

The Hyphen Node.js SDK also provides a `Link` class that allows you to create and manage short codes. This can be useful for generating short links for your application.

* [Website](https://hyphen.ai/link)
* [Guides](https://docs.hyphen.ai/docs/create-short-link)
* [API Reference](https://docs.hyphen.ai/reference/post_api-organizations-organizationid-link-codes)

## Creating a Short Code
To create a short code, you can use the `createShortCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const longUrl = 'https://hyphen.ai';
const domain = 'test.h4n.link';
const options = {
  tags: ['sdk-test', 'unit-test'],
};
const response = await link.createShortCode(longUrl, domain, options);
console.log('Short Code Response:', response);
```

## Updating a Short Code
To update a short code, you can use the `updateShortCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code you want to update
const longUrl = 'https://hyphen.ai/updated';
const options = {
  title: 'Updated Short Code',
  tags: ['sdk-test', 'unit-test'],
  long_url: longUrl,
};

const updateResponse = await link.updateShortCode(code, options);
console.log('Update Short Code Response:', updateResponse);
```

## Getting a Short Code
To get a short code, you can use the `getShortCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code you want to get
const response = await link.getShortCode(code);
console.log('Get Short Code Response:', response);
```

## Getting Short Codes
To get a list of short codes, you can use the `getShortCodes` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const title = 'My Short Codes'; // Optional title to filter short codes
const tags = ['sdk-test', 'unit-test']; // Optional tags to filter short codes
const response = await link.getShortCodes(title, tags);
console.log('Get Short Codes Response:', response);
```

## Deleting a Short Code
if you want to delete a short code you can do it like this:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code you want to delete
const response = await link.deleteShortCode(code);
console.log('Delete Short Code Response:', response);
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
HYPHEN_PUBLIC_API_KEY=your_public_api_key
HYPHEN_API_KEY=your_api_key
HYPHEN_APPLICATION_ID=your_project_id
HYPHEN_LINK_DOMAIN=your_link_domain
HYPHEN_ORGANIZATION_ID=your_organization_id
```

A bit more information about the environment variables:

| Variable | Example Value | Description |
|----------------|----------------|----------------|
| *HYPHEN_PUBLIC_API_KEY* | `public_api_key` | The public API key for your Hyphen project. You can find this in the Hyphen dashboard. |
| *HYPHEN_API_KEY* | `api_key` | The API key for your Hyphen project. You can find this in the Hyphen dashboard. |
| *HYPHEN_APPLICATION_ID* | `application_id` | The application ID for your Hyphen project. You can find this in the Hyphen dashboard. |
| *HYPHEN_LINK_DOMAIN* | `test.h4n.link` | The domain for the Link service. This is used for generating links. |
| *HYPHEN_ORGANIZATION_ID* | `org_668575c0e169cde974a5c76a` | | The organization ID for your Hyphen project. This is used for the Link service. |

Then run the tests with the following command:

```bash
pnpm i && pnpm test
```

# License and Copyright
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
The copyright for this project is held by Hyphen, Inc. All rights reserved.