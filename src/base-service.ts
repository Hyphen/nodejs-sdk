import {Hookified, type HookifiedOptions} from 'hookified';
import {Cacheable} from 'cacheable';
import axios, {type AxiosRequestConfig} from 'axios';
import pino from 'pino';

export type BaseServiceOptions = {
	throwErrors?: boolean;
} & HookifiedOptions;

export enum ErrorMessages {
	API_KEY_REQUIRED = 'API key is required. Please provide it via options or set the HYPHEN_API_KEY environment variable.',
	PUBLIC_API_KEY_SHOULD_NOT_BE_USED = 'The provided API key is a public API key. Please provide a valid non public API key for authentication.',
}

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

	public async get<T>(url: string, config?: AxiosRequestConfig) {
		return axios.get<T>(url, config);
	}

	public async post<T>(url: string, data: any, config?: AxiosRequestConfig) {
		return axios.post<T>(url, data, config);
	}

	public async put<T>(url: string, data: any, config?: AxiosRequestConfig) {
		return axios.put<T>(url, data, config);
	}

	public async delete<T>(url: string, config?: AxiosRequestConfig) {
		if(config) {
			if (config.headers) {
				delete config.headers['content-type'];
			}
		}
		return axios.delete<T>(url, config);
	}

	public async patch<T>(url: string, data: any, config?: AxiosRequestConfig) {
		return axios.patch<T>(url, data, config);
	}

	public createHeaders(apiKey?: string): Record<string, string> {
		const headers: Record<string, string> = {
			'content-type': 'application/json',
			accept: 'application/json',
		};
		if (apiKey) {
			headers['x-api-key'] = apiKey;
		}

		return headers;
	}
}
