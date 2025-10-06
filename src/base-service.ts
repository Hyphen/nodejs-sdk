// biome-ignore-all lint/suspicious/noExplicitAny: this is for http client and helpers
import { CacheableNet, type FetchRequestInit } from "@cacheable/net";
import { Cacheable } from "cacheable";
import { Hookified, type HookifiedOptions } from "hookified";
import pino from "pino";

// Define response type to match axios response structure
export interface HttpResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: any;
	config: any;
	request?: any;
}

export type BaseServiceOptions = {
	throwErrors?: boolean;
} & HookifiedOptions;

export enum ErrorMessages {
	API_KEY_REQUIRED = "API key is required. Please provide it via options or set the HYPHEN_API_KEY environment variable.",
	PUBLIC_API_KEY_SHOULD_NOT_BE_USED = "The provided API key is a public API key. Please provide a valid non public API key for authentication.",
}

export class BaseService extends Hookified {
	private _log: pino.Logger = pino();
	private _cache = new Cacheable();
	private _throwErrors = false;
	private _net: CacheableNet;

	constructor(options?: BaseServiceOptions) {
		super(options);
		if (options && options.throwErrors !== undefined) {
			this._throwErrors = options.throwErrors;
		}
		this._net = new CacheableNet({ cache: this._cache, useHttpCache: false });
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
		this._net.cache = value;
	}

	public get throwErrors(): boolean {
		return this._throwErrors;
	}

	public set throwErrors(value: boolean) {
		this._throwErrors = value;
	}

	public error(message: string, ...args: any[]): void {
		this._log.error(message, ...args);

		this.emit("error", message, ...args);
		if (this.throwErrors) {
			throw new Error(message);
		}
	}

	public warn(message: string, ...args: any[]): void {
		this._log.warn(message, ...args);

		this.emit("warn", message, ...args);
	}

	public info(message: string, ...args: any[]): void {
		this._log.info(message, ...args);
		this.emit("info", message, ...args);
	}

	public async get<T>(
		url: string,
		config?: FetchRequestInit & { params?: any },
	): Promise<HttpResponse<T>> {
		// Handle query parameters if provided
		let finalUrl = url;
		if (config?.params) {
			const params = new URLSearchParams(config.params);
			finalUrl = `${url}?${params.toString()}`;
		}
		const { params: _, ...fetchConfig } = config || {};
		const response = await this._net.get<T>(finalUrl, fetchConfig);
		return {
			data: response.data,
			status: response.response.status,
			statusText: response.response.statusText,
			headers: response.response.headers,
			config: config as any,
			request: undefined,
		};
	}

	public async post<T>(
		url: string,
		data: any,
		config?: FetchRequestInit,
	): Promise<HttpResponse<T>> {
		const response = await this._net.post<T>(url, data, config);
		return {
			data: response.data,
			status: response.response.status,
			statusText: response.response.statusText,
			headers: response.response.headers,
			config: config as any,
			request: undefined,
		};
	}

	public async put<T>(
		url: string,
		data: any,
		config?: FetchRequestInit,
	): Promise<HttpResponse<T>> {
		// @cacheable/net doesn't have a put method, so we'll use fetch with method: 'PUT'
		const requestInit: FetchRequestInit = {
			...config,
			method: "PUT",
			body: typeof data === "string" ? data : JSON.stringify(data),
			headers: {
				"Content-Type": "application/json",
				...(config?.headers as any),
			},
		};
		const response = await this._net.fetch(url, requestInit);
		const responseData = (await response.json()) as T;
		return {
			data: responseData,
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
			config: config as any,
			request: undefined,
		};
	}

	public async delete<T>(
		url: string,
		config?: FetchRequestInit & { data?: any },
	): Promise<HttpResponse<T>> {
		const headers = { ...(config?.headers as any) };
		if (headers) {
			delete headers["content-type"];
		}

		// Handle data property from axios-style config
		const { data: configData, ...restConfig } = config || {};
		let body: string | undefined;
		if (configData) {
			body =
				typeof configData === "string"
					? /* c8 ignore next */
						configData
					: JSON.stringify(configData);
			// Add content-type back if we have data
			if (!headers["content-type"] && !headers["Content-Type"]) {
				headers["content-type"] = "application/json";
			}
		}

		// Use fetch directly for DELETE to handle 204 status codes properly
		const response = await this._net.fetch(url, {
			...restConfig,
			headers,
			body,
			method: "DELETE",
		});

		let data: T | undefined;
		if (response.status !== 204) {
			const text = await response.text();
			try {
				data = text ? JSON.parse(text) : undefined;
			} catch {
				data = text as any;
			}
		}

		return {
			data: data as T,
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
			config: config as any,
			request: undefined,
		};
	}

	public async patch<T>(
		url: string,
		data: any,
		config?: FetchRequestInit,
	): Promise<HttpResponse<T>> {
		const response = await this._net.patch<T>(url, data, config);
		return {
			data: response.data,
			status: response.response.status,
			statusText: response.response.statusText,
			headers: response.response.headers,
			config: config as any,
			request: undefined,
		};
	}

	public createHeaders(apiKey?: string): Record<string, string> {
		const headers: Record<string, string> = {
			"content-type": "application/json",
			accept: "application/json",
		};
		if (apiKey) {
			headers["x-api-key"] = apiKey;
		}

		return headers;
	}
}
