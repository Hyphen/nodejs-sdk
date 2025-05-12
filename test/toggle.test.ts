import process from 'node:process';
import dotenv from 'dotenv';
import {describe, expect, test} from 'vitest';
import {Toggle, type Context} from '../src/toggle.js';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/naming-convention
const HYPHEN_PUBLIC_API_KEY = process.env.HYPHEN_PUBLIC_API_KEY;
// eslint-disable-next-line @typescript-eslint/naming-convention
const HYPHEN_APPLICATION_ID = process.env.HYPHEN_APPLICATION_ID;

if (!HYPHEN_PUBLIC_API_KEY || !HYPHEN_APPLICATION_ID) {
	throw new Error('HYPHEN_PUBLIC_API_KEY and HYPHEN_APPLICATION_ID must be set for tests to run.');
} else {
	console.log('HYPHEN_APPLICATION_ID:', HYPHEN_APPLICATION_ID);
}

const defaultOptions = {
	application: 'my-app',
	publicKey: 'my-public-key',
	environment: 'development',
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

describe('Toggle', () => {
	test('should create an instance of Toggle', () => {
		const toggle = new Toggle(defaultOptions);
		expect(toggle).toBeInstanceOf(Toggle);
	});

	test('should have environment set by NODE_ENV', () => {
		const toggle = new Toggle({
			application: 'my-app',
			publicKey: 'my-public-key',
		});
		expect(toggle.environment).toEqual('test');
	});

	test('should set options correctly', () => {
		const toggle = new Toggle(defaultOptions);
		expect(toggle.environment).toEqual('development');
		expect(toggle.application).toEqual('my-app');
	});

	test('should update application and environment properties', () => {
		const toggle = new Toggle(defaultOptions);
		expect(toggle.application).toEqual('my-app');
		expect(toggle.environment).toEqual('development');
		toggle.application = 'new-app';
		toggle.environment = 'production';
		expect(toggle.application).toEqual('new-app');
		expect(toggle.environment).toEqual('production');
	});

	test('should set the public key', () => {
		const toggle = new Toggle(defaultOptions);
		expect(toggle.publicKey).toEqual('my-public-key');
		toggle.publicKey = 'new-public-key';
		expect(toggle.publicKey).toEqual('new-public-key');
	});

	test('should be able to set context and reset client', async () => {
		const toggle = new Toggle(defaultOptions);
		toggle.setContext({userId: '123'});
		const client = await toggle.getClient();
		expect(client).toBeDefined();
	});
});

describe('Toggle Integration', () => {
	test('should get a client and evaluate a feature flag', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.getBoolean('hyphen-sdk-boolean', false);
		expect(value).toBe(true);
	});

	test('should get a string value from a feature flag', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.getString('hyphen-sdk-string', 'default');
		expect(value).toBe('Hyphen!');
	});

	test('should get a number value from a feature flag', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.getNumber('hyphen-sdk-number', 0);
		expect(value).toBe(42);
	});

	test('should get a json / object value from a feature flag', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.getObject('hyphen-sdk-json', {default: 'value'});
		expect(value).toEqual({id: 'Hello World!'});
	});

	test('should be able to use type inference for boolean', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.get<boolean>('hyphen-sdk-boolean', false);
		expect(value).toBe(true);
	});

	test('should be able to use type inference for string', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.get<string>('hyphen-sdk-string', 'default');
		expect(value).toBe('Hyphen!');
	});

	test('should be able to use type inference for json', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.get<{id: string}>('hyphen-sdk-json', {id: 'value'});
		expect(value).toEqual({id: 'Hello World!'});
	});

	test('should be able to use type inference for number', async () => {
		const toggle = new Toggle({
			application: HYPHEN_APPLICATION_ID,
			publicKey: HYPHEN_PUBLIC_API_KEY,
			environment: 'production',
		});
		toggle.setContext(context);

		const value = await toggle.get<number>('hyphen-sdk-number', 0);
		expect(value).toEqual(42);
	});
});
