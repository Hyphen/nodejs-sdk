import {Hookified, type HookifiedOptions} from 'hookified';
import {Cacheable} from 'cacheable';
import axios, {type AxiosRequestConfig} from 'axios';
import pino from 'pino';

export type BaseServiceOptions = {
	throwErrors?: boolean;
} & HookifiedOptions;

export class BaseService extends Hookified {
	private _log: pino.Logger = pino();
	private _cache = new Cacheable();
	private _throwErrors = false;

	constructor(options?: BaseServiceOptions) {
		super(options);
		if (options && options.throwErrors !== undefined) {
			this._throwErrors = options.throwErrors;
		}
	}

	public get log(): pino.Logger {
		return this._log;
	}

	public set log(value: pino.Logger) {
		this._log = value;
	}

	public get cache(): Cacheable {
		return this._cache;
	}

	public set cache(value: Cacheable) {
		this._cache = value;
	}

	public get throwErrors(): boolean {
		return this._throwErrors;
	}

	public set throwErrors(value: boolean) {
		this._throwErrors = value;
	}

	public error(message: string, ...args: any[]): void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._log.error(message, ...args);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emit('error', message, ...args);
		if (this.throwErrors) {
			throw new Error(message);
		}
	}

	public warn(message: string, ...args: any[]): void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._log.warn(message, ...args);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emit('warn', message, ...args);
	}

	public info(message: string, ...args: any[]): void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._log.info(message, ...args);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emit('info', message, ...args);
	}

	public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await axios.get<T>(url, config);
			this.info(`GET request to ${url} successful`);
			return response.data;
		} catch (error) {
			this.error(`GET request to ${url} failed`, error);
			return undefined as T;
		}
	}

	public async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await axios.post<T>(url, data, config);
			this.info(`POST request to ${url} successful`);
			return response.data;
		} catch (error) {
			this.error(`POST request to ${url} failed`, error);
			return undefined as T;
		}
	}

	public async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await axios.put<T>(url, data, config);
			this.info(`PUT request to ${url} successful`);
			return response.data;
		} catch (error) {
			this.error(`PUT request to ${url} failed`, error);
			return undefined as T;
		}
	}

	public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await axios.delete<T>(url, config);
			this.info(`DELETE request to ${url} successful`);
			return response.data;
		} catch (error) {
			this.error(`DELETE request to ${url} failed`, error);
			return undefined as T;
		}
	}

	public async patch<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await axios.patch<T>(url, data, config);
			this.info(`PATCH request to ${url} successful`);
			return response.data;
		} catch (error) {
			this.error(`PATCH request to ${url} failed`, error);
			return undefined as T;
		}
	}
}
