/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import process from 'node:process';
import {
	describe, expect, test, vi,
} from 'vitest';
import pino from 'pino';
import {Cacheable} from 'cacheable';
import {BaseService} from '../src/base-service.js';

const mockHttpUrl = process.env.MOCK_HTTP_URL ?? 'https://mockhttp.org';

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
		const logger: pino.Logger = pino();
		service.log = logger;
		expect(service.log).toBe(logger);
	});

	test('should allow setting and getting cache', () => {
		const service = new BaseService();
		const cache = new Cacheable();
		service.cache = cache;
		expect(service.cache).toBe(cache);
	});

	test('should allow setting and getting throwErrors', () => {
		const service = new BaseService({throwErrors: true});
		service.throwErrors = true;
		expect(service.throwErrors).toBe(true);
	});

	test('should log error and emit error event', () => {
		const service = new BaseService({throwErrors: true});
		const errorSpy = vi.spyOn(service.log, 'error');
		const emitSpy = vi.spyOn(service, 'emit');
		expect(() => {
			service.error('Test error');
		}).toThrow('Test error');
		expect(errorSpy).toHaveBeenCalledWith('Test error');
		expect(emitSpy).toHaveBeenCalledWith('error', 'Test error');
	});

	test('should log warning and emit warn event', () => {
		const service = new BaseService();
		const warnSpy = vi.spyOn(service.log, 'warn');
		const emitSpy = vi.spyOn(service, 'emit');
		service.warn('Test warning');
		expect(warnSpy).toHaveBeenCalledWith('Test warning');
		expect(emitSpy).toHaveBeenCalledWith('warn', 'Test warning');
	});

	test('should log info and emit info event', () => {
		const service = new BaseService();
		const infoSpy = vi.spyOn(service.log, 'info');
		const emitSpy = vi.spyOn(service, 'emit');
		service.info('Test info');
		expect(infoSpy).toHaveBeenCalledWith('Test info');
		expect(emitSpy).toHaveBeenCalledWith('info', 'Test info');
	});

	test('should do a get request', async () => {
		const service = new BaseService();
		const url = `${mockHttpUrl}/get`;
		const response = await service.get(url);
		expect(response).toBeDefined();
	});

	test('should handle a post request', async () => {
		const service = new BaseService();
		const url = `${mockHttpUrl}/post`;
		const data = {key: 'value'};
		const response = await service.post(url, data);
		expect(response).toBeDefined();
	});

	test('should handle a put request', async () => {
		const service = new BaseService();
		const url = `${mockHttpUrl}/put`;
		const data = {key: 'value'};
		const response = await service.put(url, data);
		expect(response).toBeDefined();
	});

	test('should handle a delete request', async () => {
		const service = new BaseService();
		const url = `${mockHttpUrl}/delete`;
		const data = {key: 'value'};
		const response = await service.delete(url, {data});
		expect(response).toBeDefined();
	});

	test('should handle a patch request', async () => {
		const service = new BaseService();
		const url = `${mockHttpUrl}/patch`;
		const data = {key: 'value'};
		const response = await service.patch(url, data);
		expect(response).toBeDefined();
	});
});
