/* eslint-disable @typescript-eslint/no-unsafe-call */
import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {loadEnv} from '../src/env.js';

describe('hyphen ENV', () => {
	test('should be able to load the environment', () => {
		loadEnv();
		expect(process.env.HYPHEN_PUBLIC_API_KEY).toBeDefined();
		expect(process.env.HYPHEN_APPLICATION_ID).toBeDefined();
	});

	test('should be able to load multiple environments', () => {
		loadEnv({currentWorkingDirectory: './test/fixtures/env-file-load'});
		expect(process.env.KEY_ID).toBe('default_key_id');
	});

	test('should be able to load multiple environments', () => {
		delete process.env.KEY_ID;
		expect(process.env.KEY_ID).toBeUndefined();
		loadEnv({currentWorkingDirectory: './test/fixtures/env-file-load', environment: 'development'});
		expect(process.env.KEY_ID).toBe('development_key_id');
	});
});
