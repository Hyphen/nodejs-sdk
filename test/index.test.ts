import {describe, expect, test} from 'vitest';
import {Toggle} from '../src/index.js';

describe('Toggle', () => {
	test('should create an instance of Toggle', () => {
		const toggle = new Toggle();
		expect(toggle).toBeInstanceOf(Toggle);
	});

	test('should set options correctly', () => {
		const toggle = new Toggle({auth: 'Bearer token'});
		expect(toggle.options).toEqual({auth: 'Bearer token'});
	});

	test('should update options correctly', () => {
		const toggle = new Toggle();
		toggle.options = {auth: 'Bearer token'};
		expect(toggle.options).toEqual({auth: 'Bearer token'});
	});
});
