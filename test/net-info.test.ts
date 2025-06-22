/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {NetInfo} from '../src/net-info.js';

describe('NetInfo', () => {
	test('should create an instance of NetInfo', () => {
		const netInfo = new NetInfo();
		expect(netInfo).toBeInstanceOf(NetInfo);
	});

	test('should have default properties', () => {
		const netInfo = new NetInfo();
		expect(netInfo.log).toBeDefined();
		expect(netInfo.cache).toBeDefined();
		expect(netInfo.throwErrors).toBe(false);
	});

	test('should allow setting and getting apiKey', () => {
		const netInfo = new NetInfo({apiKey: 'test_api_key1'});
		expect(netInfo.apiKey).toBe('test_api_key1');
		netInfo.apiKey = 'test_api_key2';
		expect(netInfo.apiKey).toBe('test_api_key2');
	});

	test('should throw an error if apiKey is not set', () => {
		// Ensure that the environment variable is not set for this test
		const originalApiKey = process.env.HYPHEN_API_KEY;
		delete process.env.HYPHEN_API_KEY;
		let didThrow = false;
		try {
			const netInfo = new NetInfo({throwErrors: true});
		} catch (error) {
			expect(error).toEqual(new Error('API key is required. Please provide it via options or set the HYPHEN_API_KEY environment variable.'));
			didThrow = true;
		}

		expect(didThrow).toBe(true);

		// Restore the original environment variable
		if (originalApiKey) {
			process.env.HYPHEN_API_KEY = originalApiKey;
		}
	});

	test('should throw an error if apiKey is set to public api key', () => {
		// Ensure that the environment variable is not set for this test
		const originalApiKey = process.env.HYPHEN_API_KEY;
		delete process.env.HYPHEN_API_KEY;
		let didThrow = false;
		try {
			const netInfo = new NetInfo({throwErrors: true, apiKey: 'public_api_key'});
		} catch (error) {
			expect(error).toEqual(new Error('The provided API key is a public API key. Please provide a valid API key for authentication.'));
			didThrow = true;
		}

		expect(didThrow).toBe(true);

		// Restore the original environment variable
		if (originalApiKey) {
			process.env.HYPHEN_API_KEY = originalApiKey;
		}
	});
});
