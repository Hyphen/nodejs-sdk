/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, test, expect} from 'vitest';
import {Hyphen} from '../src/hyphen.js';
import {NetInfo} from '../src/net-info.js';
import {Toggle} from '../src/toggle.js';

describe('Hyphen', () => {
	test('should create an instance of Hyphen', () => {
		const hyphen = new Hyphen();
		expect(hyphen).toBeInstanceOf(Hyphen);
	});

	test('should accept options in the constructor', () => {
		const options = {publicApiKey: 'test-key'};
		const hyphen = new Hyphen(options);
		expect(hyphen).toBeInstanceOf(Hyphen);
	});

	test('should have a netInfo property', () => {
		const hyphen = new Hyphen();
		expect(hyphen.netInfo).toBeDefined();
		expect(hyphen.netInfo).toBeInstanceOf(NetInfo);
	});

	test('should have a toggle property', () => {
		const hyphen = new Hyphen();
		expect(hyphen.toggle).toBeDefined();
		expect(hyphen.toggle).toBeInstanceOf(Toggle);
	});
});
