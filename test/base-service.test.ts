/* eslint-disable @typescript-eslint/no-unsafe-call */
import {describe, expect, test} from 'vitest';
import pino from 'pino';
import {Cacheable} from 'cacheable';
import {BaseService} from '../src/base-service.js';

describe('BaseService', () => {
	test('should create an instance of BaseService', () => {
		const service = new BaseService();
		expect(service).toBeInstanceOf(BaseService);
	});

	test('should have default properties', () => {
		const service = new BaseService();
		expect(service.log).toBeDefined();
		expect(service.cache).toBeDefined();
		expect(service.throwErrors).toBe(false);
	});

	test('should allow setting and getting log', () => {
		const service = new BaseService();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const logger: pino.Logger = pino();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		service.log = logger;
		expect(service.log).toBe(logger);
	});

	test('should allow setting and getting cache', () => {
		const service = new BaseService();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const cache = new Cacheable();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		service.cache = cache;
		expect(service.cache).toBe(cache);
	});

	test('should allow setting and getting throwErrors', () => {
		const service = new BaseService();
		service.throwErrors = true;
		expect(service.throwErrors).toBe(true);
	});
});
