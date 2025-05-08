import {describe, expect, test} from 'vitest';
import {Toggle} from '../src/index.js';

describe('hyphen sdk', () => {
	test('should create an instance of Toggle', () => {
		const toggle = new Toggle({
			application: 'my-app',
			environment: 'development',
		});
		expect(toggle).toBeInstanceOf(Toggle);
	});
});
