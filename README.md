![Hyphen AI](https://github.com/Hyphen/nodejs-sdk/raw/main/logo.png)

[![tests](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml/badge.svg)](https://github.com/Hyphen/nodejs-sdk/actions/workflows/tests.yaml)
[![codecov](https://codecov.io/gh/Hyphen/nodejs-sdk/graph/badge.svg?token=7SZ2hbuPR3)](https://codecov.io/gh/Hyphen/nodejs-sdk)
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
	- [Getting all Organization Tags](#getting-all-organization-tags)
	- [Getting Short Code Stats](#getting-short-code-stats)
	- [Deleting a Short Code](#deleting-a-short-code)
	- [Creating a QR Code from a Short Code](#creating-a-qr-code-from-a-short-code)
	- [Get QR Codes for a Short Code](#get-qr-codes-for-a-short-code)
	- [Deleting a QR Code](#deleting-a-qr-code)
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

## Breaking Changes (v2.0)

**⚠️ The Toggle API has been simplified in v2.0. Please review the changes below:**

### Removed Methods
- ❌ `setContext(context)` - Use property setter instead: `toggle.defaultContext = context`
- ❌ `setPublicApiKey(key)` - Use property setter instead: `toggle.publicApiKey = key`
- ❌ `getClient()` - No longer needed, use the Toggle instance directly

### Removed Options
- ❌ `throwErrors` - Errors are now always emitted via events and default values are returned

### Changed Behavior
- Hooks removed from convenience methods (`getBoolean`, `getString`, etc.)
- Hooks now only available via event system (`toggle.on('error', ...)`)
- All toggle methods now return default values on error instead of throwing

### Migration Guide

**Before (v1.x):**
```javascript
const toggle = new Toggle(options);
toggle.setContext(context);
const client = await toggle.getClient();
```

**After (v2.0):**
```javascript
const toggle = new Toggle(options);
toggle.defaultContext = context;
// Use toggle directly - no getClient() needed
```

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

You can also set or update the context after initialization using the `defaultContext` property:

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

// Set the default context
toggle.defaultContext = context;

const result = await toggle.getBoolean('hyphen-sdk-boolean', false);

console.log('Boolean toggle value:', result); // true
```

If you would like to override the context for a single request you can do it like this:

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
| *publicApiKey* | `string` | The public API key for your Hyphen project. You can find this in the Hyphen dashboard. |
| *applicationId* | `string` | The application ID for your Hyphen project. You can find this in the Hyphen dashboard. |
| *environment?* | `string` | The environment for your Hyphen project such as `production`. Default uses `process.env.NODE_ENV` |
| *context?* or *defaultContext?* | `ToggleContext` | The context object that contains the user and custom attributes. This is optional. |
| *horizonUrls?* or *uris?* | `string[]` | Array of Horizon endpoint URLs for load balancing. If not provided, defaults to Hyphen's hosted service. |
| *caching?* | `{ ttl: number, generateCacheKeyFn: (context?: ToggleContext) => string}` | Cache configuration. The `ttl` is in milliseconds. |

## Toggle API

### Methods

| Method | Parameters | Description |
|----------------|----------------|----------------|
| *get<T>* | `key: string, defaultValue: T, options?: GetOptions` | Get the value of a toggle. This is a generic method that can be used to get any type from toggle. |
| *getBoolean* | `key: string, defaultValue: boolean, options?: GetOptions` | Get the value of a boolean toggle. |
| *getNumber* | `key: string, defaultValue: number, options?: GetOptions` | Get the value of a number toggle. |
| *getString* | `key: string, defaultValue: string, options?: GetOptions` | Get the value of a string toggle. |
| *getObject<T>* | `key: string, defaultValue: T, options?: GetOptions` | Get the value of an object toggle. |
| *fetch<T>* | `path: string, payload?: unknown, options?: RequestInit` | Make a raw HTTP POST request to Horizon endpoints. |

### Properties (Getters/Setters)

| Property | Type | Description |
|----------------|----------------|----------------|
| *publicApiKey* | `string \| undefined` | Get or set the public API key. |
| *defaultContext* or *context* | `ToggleContext \| undefined` | Get or set the default context for toggle evaluations. |
| *applicationId* | `string \| undefined` | Get or set the application ID. |
| *environment* | `string \| undefined` | Get or set the environment. |
| *horizonUrls* or *uris* | `string[]` | Get or set the Horizon endpoint URLs for load balancing. |
| *defaultTargetingKey* | `string` | Get or set the default targeting key. |
| *organizationId* | `string \| undefined` | Get the organization ID (read-only, extracted from public key). |

### GetOptions

The `GetOptions` type is used in toggle getter methods:

```typescript
type GetOptions = {
  context?: ToggleContext;  // Override the default context for this request
  cache?: boolean;          // Whether to use caching (if configured)
};
```

## Toggle Hooks

Toggle extends the Hookified class, which provides a flexible hook system for intercepting and modifying behavior. You can register hooks using the `onHook()` method.

**Note:** Hooks are currently only implemented on the base `get<T>()` method and event emitters.

### Available Hooks

You can listen to errors using the `error` event:

```javascript
import { Toggle } from '@hyphen/sdk';

const toggle = new Toggle({
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
});

toggle.on('error', (error) => {
  console.error('Toggle error:', error);
});

const result = await toggle.getBoolean('my-feature', false);
```

### Custom Hooks (Advanced)

Since Toggle extends Hookified, you can create custom hooks for advanced use cases:

```javascript
import { Toggle } from '@hyphen/sdk';

const toggle = new Toggle({
  publicApiKey: 'your_public_api_key',
  applicationId: 'your_application_id',
});

// Register a custom hook
toggle.onHook('myCustomHook', (data) => {
  console.log('Custom hook called:', data);
});

// Trigger the hook (in your own code)
await toggle.hook('myCustomHook', { someData: 'value' });
```

## Toggle Error Handling

The SDK provides a way to handle errors that occur during toggle requests. You can use the `.on` method to listen for errors globally. When an error occurs, the toggle methods will return the default value provided.

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
console.log('Boolean toggle value:', result); // Returns false (default) if error occurs
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
  caching: {
	ttl: 60000, // Cache for 60 seconds (in milliseconds)
  },
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
  caching: {
	ttl: 60000, // Cache for 60 seconds (in milliseconds)
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

Toggle uses [Horizon](https://hyphen.ai/horizon) to fetch the feature flags. If you are using a self-hosted version of Hyphen you can use the `horizonUrls` (or `uris` for backward compatibility) option in the constructor to set the URL of your self-hosted version:

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
  horizonUrls: [
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
  horizonUrls: [
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
To load your environment variables, you can use the `env()` function from the SDK. This function will automatically load your environment variables from the `.env` file and then override them with the environment based environment file if it exists (ex: `.env.development`). This is useful for managing different environments such as development, staging, and production. 

The following override path is:
```
.env -> .env.local -> .env.<environment> -> .env.<environment>.local
```

Here is an example of how to use the `env()` function:

```javascript
import { env } from '@hyphen/sdk';

//load your default environment variables and envrionment variables
env();
```

If your environment variables are not stored in the root of your project you can specify the path to your `.env` file:

```javascript
import { env } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
env({ path: '/path/to/your/env/files/' });
```

You can also specify the environment variables to load by passing an array of variable names:

```javascript
import { env } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
env({ environment: 'development' });
```

if you want to turn off the local environment variables you can do it like this:

```javascript
import { env } from '@hyphen/sdk';
//load your default environment variables and envrionment variables
env({ local: false });
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

## Getting all Organization Tags

To get all tags for your organization, you can use the `getTags` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const response = await link.getTags();
console.log('Get Tags Response:', response);
```

## Get Short Code Stats

To get the stats for a short code, you can use the `getShortCodeStats` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code
const startDate = new Date('2023-01-01'); // Optional start date for the stats
const endDate = new Date('2023-12-31'); // Optional end date for the stats
const response = await link.getShortCodeStats(code, startDate, endDate);
console.log('Get Short Code Stats Response:', response);
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

## Creating a QR Code from a Short Code

To create a QR code from a short code, you can use the `createQrCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code you want to create a QR code for
const response = await link.createQrCode(code);
console.log('Create QR Code Response:', response);
```

There are options that you can pass in to the `createQrCode` method to customize the QR code:

```typescript
export type CreateQrCodeOptions = {
	/**
	 * The title of the QR code. This is used for display purposes.
	 * @default undefined
	 */
	title?: string;
	/**
	 * The background color of the QR code. This is a hex color code.
	 * @default '#ffffff'
	 */
	backgroundColor?: string;
	/**
	 * The color of the QR code. This is a hex color code.
	 * @default '#000000'
	 */
	color?: string;
	/**
	 * The size of the QR code. This can be 'small', 'medium', or 'large'.
	 * @default QrSize.MEDIUM
	 */
	size?: QrSize;
	/**
	 * The logo to include in the QR code. This should be a base64 encoded string.
	 * @default undefined
	 */
	logo?: string;
};
```

## Get a QR Code By Id

To get a specific QR code by its ID, you can use the `getQrCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code
const qr = 'qr_1234567890'; // It is the ID of the QR code you want to retrieve
const response = await link.getQrCode(code, qr);
console.log('Get QR Code Response:', response);
```

## Get QR Codes for a Short Code

To get all QR codes for a short code, you can use the `getQrCodes` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code
const response = await link.getQrCodes(code);
console.log('Get QR Codes Response:', response);
```

## Deleting a QR Code

To delete a QR code, you can use the `deleteQrCode` method:

```javascript
import { Link } from '@hyphen/sdk';
const link = new Link({
  organizationId: 'your_organization_id',
  apiKey: 'your_api_key',
});
const code = 'code_1234567890'; // It is the code identifier for the short code
const qr = 'qr_1234567890'; // It is the ID of the QR code you want to delete
const response = await link.deleteQrCode(code, qr);
console.log('Delete QR Code Response:', response);
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