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

export type BaseServiceOptions = HookifiedOptions;

export enum ErrorMessages {
	API_KEY_REQUIRED = "API key is required. Please provide it via options or set the HYPHEN_API_KEY environment variable.",
	PUBLIC_API_KEY_SHOULD_NOT_BE_USED = "The provided API key is a public API key. Please provide a valid non public API key for authentication.",
}

export class BaseService extends Hookified {
	private _log: pino.Logger = pino();
	private _cache = new Cacheable();
	private _net: CacheableNet;

	constructor(options?: BaseServiceOptions) {
		super(options);
		this._net = new CacheableNet({
			cache: this._cache,
		});
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

	public error(message: string, ...args: any[]): void {
		this._log.error(message, ...args);
		this.emit("error", message, ...args);
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
		try {
			const response = await this._net.post<T>(url, data, config);
			return {
				data: response.data,
				status: response.response.status,
				statusText: response.response.statusText,
				headers: response.response.headers,
				config: config as any,
				request: undefined,
			};
		} catch (error) {
			throw await this._enrichFetchError("POST", url, data, config, error);
		}
	}

	public async put<T>(
		url: string,
		data: any,
		config?: FetchRequestInit,
	): Promise<HttpResponse<T>> {
		try {
			const response = await this._net.put<T>(url, data, config);
			return {
				data: response.data,
				status: response.response.status,
				statusText: response.response.statusText,
				headers: response.response.headers,
				config: config as any,
				request: undefined,
			};
		} catch (error) {
			throw await this._enrichFetchError("PUT", url, data, config, error);
		}
	}

	public async delete<T>(
		url: string,
		config?: FetchRequestInit & { data?: any },
	): Promise<HttpResponse<T>> {
		const headers = { ...(config?.headers as any) };
		/* v8 ignore next -- @preserve */
		if (headers) {
			delete headers["content-type"];
		}

		// Handle data property from axios-style config
		const { data: configData, ...restConfig } = config || {};
		let body: string | undefined;
		if (configData) {
			/* v8 ignore next -- @preserve */
			body =
				typeof configData === "string"
					? configData
					: JSON.stringify(configData);
			// Add content-type back if we have data
			/* v8 ignore next -- @preserve */
			if (!headers["content-type"] && !headers["Content-Type"]) {
				headers["content-type"] = "application/json";
			}
		}

		let response: Response;
		try {
			// Use fetch directly for DELETE to handle 204 status codes properly
			response = await this._net.fetch(url, {
				...restConfig,
				headers,
				body,
				method: "DELETE",
			});
		} catch (error) {
			throw await this._enrichFetchError(
				"DELETE",
				url,
				configData,
				config,
				error,
			);
		}

		let data: T | undefined;
		if (response.status !== 204) {
			const text = await response.text();
			/* v8 ignore next -- @preserve */
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
		try {
			const response = await this._net.patch<T>(url, data, config);
			return {
				data: response.data,
				status: response.response.status,
				statusText: response.response.statusText,
				headers: response.response.headers,
				config: config as any,
				request: undefined,
			};
		} catch (error) {
			throw await this._enrichFetchError("PATCH", url, data, config, error);
		}
	}

	private async _enrichFetchError(
		method: string,
		url: string,
		data: any,
		config: FetchRequestInit | undefined,
		originalError: unknown,
	): Promise<Error> {
		// `@cacheable/net` always throws `Error` instances; this cast keeps
		// the helper focused on the diagnostic flow.
		const error = originalError as Error;
		// `@cacheable/net` discards the response body when a request returns a
		// non-2xx status, leaving only "Fetch failed with status N". Re-issue
		// the request with native fetch so the body is available for diagnostics.
		const match = error.message.match(/Fetch failed with status (\d+)/);
		/* v8 ignore next 3 -- @preserve */
		if (!match) {
			return error;
		}
		try {
			const headers: Record<string, string> = {
				...(config?.headers as Record<string, string> | undefined),
			};
			let body: BodyInit | undefined;
			if (data !== undefined && data !== null) {
				/* v8 ignore next 8 -- @preserve */
				if (
					typeof data === "string" ||
					data instanceof FormData ||
					data instanceof URLSearchParams ||
					data instanceof Blob
				) {
					body = data;
				} else {
					body = JSON.stringify(data);
					/* v8 ignore next 3 -- @preserve */
					if (!headers["Content-Type"] && !headers["content-type"]) {
						headers["content-type"] = "application/json";
					}
				}
			}
			const res = await fetch(url, { method, headers, body });
			/* v8 ignore next 4 -- @preserve */
			if (res.ok) {
				// The retry unexpectedly succeeded — surface the original error.
				return error;
			}
			const text = await res.text();
			return new Error(`Fetch failed with status ${res.status}: ${text}`);
			/* v8 ignore next 3 -- @preserve */
		} catch {
			return error;
		}
	}

	public createHeaders(apiKey?: string): Record<string, string> {
		const headers: Record<string, string> = {
			"content-type": "application/json",
			accept: "application/json",
		};
		/* v8 ignore next -- @preserve */
		if (apiKey) {
			headers["x-api-key"] = apiKey;
		}

		return headers;
	}
}
