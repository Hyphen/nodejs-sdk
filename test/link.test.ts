/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {Link} from '../src/link.js';

const apiKey: string = process.env.HYPHEN_API_KEY ?? 'test-api-key';

describe('Link', () => {
	test('should create a Link instance with default URIs', () => {
		const link = new Link({organizationId: 'test-org', apiKey});
		expect(link.uris).toEqual(['https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/']);
		expect(link.organizationId).toBe('test-org');
	});

	test('should create a Link instance with custom URIs', () => {
		const customUris = ['https://custom.api/hyphen/link/codes/'];
		const link = new Link({uris: customUris, organizationId: 'test-org', apiKey});
		expect(link.uris).toEqual(customUris);
	});

	test('should set and get organization ID', () => {
		const link = new Link({organizationId: 'test-org', apiKey});
		expect(link.organizationId).toBe('test-org');
		link.organizationId = 'new-org';
		expect(link.organizationId).toBe('new-org');
	});

	test('should set and get URIs', () => {
		const link = new Link({organizationId: 'test-org', apiKey});
		const newUris = ['https://new.api/hyphen/link/codes/'];
		link.uris = newUris;
		expect(link.uris).toEqual(newUris);
	});

	test('should set and get API key', () => {
		const link = new Link({organizationId: 'test-org', apiKey});
		expect(link.apiKey).toBe(apiKey);
		const newApiKey = 'new-api-key';
		link.apiKey = newApiKey;
		expect(link.apiKey).toBe(newApiKey);
	});

	test('should throw an error if API key starts with "public_"', () => {
		const link = new Link({organizationId: 'test-org', apiKey});
		expect(() => {
			link.setApiKey('public_test-api-key');
		}).toThrow('API key cannot start with "public_"');
	});
});
