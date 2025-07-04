/* eslint-disable @typescript-eslint/no-unsafe-call */
import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {Link} from '../src/link.js';

describe('Link', () => {
	test('should create a Link instance with default URIs', () => {
		const link = new Link({organizationId: 'test-org'});
		expect(link.uris).toEqual(['https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/']);
		expect(link.organizationId).toBe('test-org');
	});

	test('should create a Link instance with custom URIs', () => {
		const customUris = ['https://custom.api/hyphen/link/codes/'];
		const link = new Link({uris: customUris, organizationId: 'test-org'});
		expect(link.uris).toEqual(customUris);
	});

	test('should set and get organization ID', () => {
		const link = new Link({organizationId: 'test-org'});
		expect(link.organizationId).toBe('test-org');
		link.organizationId = 'new-org';
		expect(link.organizationId).toBe('new-org');
	});

	test('should set and get URIs', () => {
		const link = new Link({organizationId: 'test-org'});
		const newUris = ['https://new.api/hyphen/link/codes/'];
		link.uris = newUris;
		expect(link.uris).toEqual(newUris);
	});
});
