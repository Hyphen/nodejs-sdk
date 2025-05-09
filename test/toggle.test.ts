import process from 'node:process';
import {describe, expect, test} from 'vitest';
import {Toggle} from '../src/toggle.js';

const defaultOptions = {
	application: 'my-app',
	publicKey: 'my-public-key',
	environment: 'development',
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
});
