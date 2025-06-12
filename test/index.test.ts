/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, expect, test} from 'vitest';
import {Toggle} from '../src/index.js';

describe('hyphen sdk', () => {
	test('should create an instance of Toggle', () => {
		const toggle = new Toggle({
			applicationId: 'my-app',
			publicApiKey: 'public_my-public-key',
			environment: 'development',
		});
		expect(toggle).toBeInstanceOf(Toggle);
	});
});
