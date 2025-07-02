/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, test, expect} from 'vitest';
import {Hyphen} from '../src/hyphen.js';

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
});
