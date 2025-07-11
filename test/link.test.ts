/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {Link} from '../src/link.js';

const apiKey: string = process.env.HYPHEN_API_KEY ?? 'test-api-key';
const organizationId: string = process.env.HYPHEN_ORGANIZATION_ID ?? 'test-organization-id';
const linkDomain: string = process.env.HYPHEN_LINK_DOMAIN ?? 'test.domain.com';
const tags: string[] = ['sdk-test', 'unit-test'];
const longUrl = ['https://hyphen.ai', 'https://hyphen.ai/env', 'https://hyphen.ai/link', 'https://hyphen.ai/toggle', 'https://hyphen.ai/net-info'];

export function getRandomLongUrl(): string {
	return longUrl[Math.floor(Math.random() * longUrl.length)];
}

describe('Link', () => {
	test('should create a Link instance with default URIs', () => {
		const link = new Link({organizationId, apiKey});
		expect(link.uris).toEqual(['https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/']);
		expect(link.organizationId).toBe(organizationId);
	});

	test('should create a Link instance with custom URIs', () => {
		const customUris = ['https://custom.api/hyphen/link/codes/'];
		const link = new Link({uris: customUris, organizationId, apiKey});
		expect(link.uris).toEqual(customUris);
	});

	test('should set and get organization ID', () => {
		const link = new Link({organizationId, apiKey});
		expect(link.organizationId).toBe(organizationId);
		link.organizationId = 'new-org';
		expect(link.organizationId).toBe('new-org');
	});

	test('should set and get URIs', () => {
		const link = new Link({organizationId, apiKey});
		const newUris = ['https://new.api/hyphen/link/codes/'];
		link.uris = newUris;
		expect(link.uris).toEqual(newUris);
	});

	test('should set and get API key', () => {
		const link = new Link({organizationId, apiKey});
		expect(link.apiKey).toBe(apiKey);
		const newApiKey = 'new-api-key';
		link.apiKey = newApiKey;
		expect(link.apiKey).toBe(newApiKey);
	});

	test('should throw an error if API key starts with "public_"', () => {
		const link = new Link({organizationId, apiKey});
		expect(() => {
			link.setApiKey('public_test-api-key');
		}).toThrow('API key cannot start with "public_"');
	});

	test('should create a short code with valid parameters', async () => {
		const link = new Link({organizationId, apiKey});
		const longUrl = getRandomLongUrl();
		const domain = linkDomain;
		const options = {tags};

		const response = await link.createShortCode(longUrl, domain, options);

		expect(response).toBeDefined();
		expect(response.id).toBeDefined();

		// retrieve the short code by ID
		if (response.id) {
			const getResponse = await link.getShortCode(response.id);
			expect(getResponse).toEqual(response);
		}

		if (response.id) {
			const deleteResponse = await link.deleteShortCode(response.id);
			expect(deleteResponse).toBe(true);
		}
	});

	test('should create a short code and get it by code', async () => {
		const link = new Link({organizationId, apiKey});
		const longUrl = getRandomLongUrl();
		const domain = linkDomain;
		const options = {tags};
		const createResponse = await link.createShortCode(longUrl, domain, options);

		expect(createResponse).toBeDefined();
		expect(createResponse.code).toBeDefined();
		expect(createResponse.long_url).toBe(longUrl);
		expect(createResponse.domain).toBe(domain);

		if (createResponse.id) {
			const getResponse = await link.getShortCode(createResponse.id);
			expect(getResponse).toEqual(createResponse);
		}
	});

	test('should throw on create a short code with invalid parameters', async () => {
		const link = new Link({organizationId, apiKey});
		const longUrl = getRandomLongUrl();
		const domain = linkDomain;
		const options = {tags};

		link.organizationId = undefined; // Clear organization ID to force an error
		await expect(link.createShortCode(longUrl, domain, options)).rejects.toThrow();
	});

	test('should delete a short code with invalid organization Id', async () => {
		const link = new Link({organizationId, apiKey});
		const fakeCodeId = 'code_1234567890abcdef';

		link.organizationId = undefined; // Clear organization ID to force an error
		await expect(link.deleteShortCode(fakeCodeId)).rejects.toThrow();
	});
});
