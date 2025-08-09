import process from "node:process";
import {
	HyphenProvider,
	type HyphenProviderOptions,
} from "@hyphen/openfeature-server-provider";
import {
	type Client,
	type EvaluationContext,
	type JsonValue,
	OpenFeature,
} from "@openfeature/server-sdk";
import dotenv from "dotenv";
import { Hookified } from "hookified";

dotenv.config();

export type ToggleContext = EvaluationContext;

export enum ToggleHooks {
	beforeGetBoolean = "beforeGetBoolean",
	afterGetBoolean = "afterGetBoolean",
	beforeGetString = "beforeGetString",
	afterGetString = "afterGetString",
	beforeGetNumber = "beforeGetNumber",
	afterGetNumber = "afterGetNumber",
	beforeGetObject = "beforeGetObject",
	afterGetObject = "afterGetObject",
}

export type ToggleCachingOptions = {
	ttl?: number;
	generateCacheKeyFn?: (context?: ToggleContext) => string;
};

export type ToggleOptions = {
	/**
	 * Your application name. If this is not set it will look for the HYPHEN_APPLICATION_ID environment variable.
	 * @type {string}
	 */
	applicationId?: string;

	/**
	 * Your Hyphen Public API key. If this is not set it will look for the HYPHEN_PUBLIC_API_KEY environment variable.
	 * @type {string}
	 */
	publicApiKey?: string;

	/**
	 * Your environment name such as development, production. Default is what is set at NODE_ENV
	 * @type {string}
	 * @example production
	 */
	environment?: string;

	/**
	 * The context to use for evaluating feature flags
	 * @type {ToggleContext}
	 */
	context?: ToggleContext;

	/**
	 * Cache options to use for the request
	 * @type {ToggleCachingOptions}
	 */
	caching?: ToggleCachingOptions;

	/**
	 * Throw errors in addition to emitting them
	 * @type {boolean}
	 * @default false
	 */
	throwErrors?: boolean;

	/**
	 * Horizon URIs to use for talking to Toggle. You can use this to override
	 * the default URIs for testin or if you are using a self-hosted version.
	 * @type {Array<string>}
	 * @example ['https://toggle.hyphen.ai']
	 */
	uris?: string[];
};

export type ToggleGetOptions = {
	/**
	 * The context to use for evaluating feature flags
	 * @type {ToggleContext}
	 */
	context?: ToggleContext;
};

export class Toggle extends Hookified {
	private _applicationId: string | undefined =
		process.env.HYPHEN_APPLICATION_ID;
	private _publicApiKey: string | undefined = process.env.HYPHEN_PUBLIC_API_KEY;
	private _environment: string;
	private _client: Client | undefined;
	private _context: EvaluationContext | undefined;
	private _throwErrors = false;
	private _uris: string[] | undefined;
	private _caching: ToggleCachingOptions | undefined;
	/*
	 * Create a new Toggle instance. This will create a new client and set the options.
	 * @param {ToggleOptions}
	 */
	constructor(options?: ToggleOptions) {
		super();

		this._throwErrors = options?.throwErrors ?? false;

		this._applicationId = options?.applicationId;
		if (options?.publicApiKey) {
			this.setPublicApiKey(options.publicApiKey);
		}

		this._environment =
			options?.environment ?? process.env.NODE_ENV ?? "development";
		this._context = options?.context;
		this._uris = options?.uris;
		this._caching = options?.caching;
	}

	/**
	 * Get the application ID
	 * @returns {string | undefined}
	 */
	public get applicationId(): string | undefined {
		return this._applicationId;
	}

	/**
	 * Set the application ID
	 * @param {string | undefined} value
	 */
	public set applicationId(value: string | undefined) {
		this._applicationId = value;
	}

	/**
	 * Get the public API key
	 * @returns {string}
	 */
	public get publicApiKey(): string | undefined {
		return this._publicApiKey;
	}

	/**
	 * Set the public API key
	 * @param {string} value
	 */
	public set publicApiKey(value: string | undefined) {
		if (!value) {
			this._publicApiKey = undefined;
			this._client = undefined;
			return;
		}

		this.setPublicApiKey(value);
	}

	/**
	 * Get the environment
	 * @returns {string}
	 */
	public get environment(): string {
		return this._environment;
	}

	/**
	 * Set the environment
	 * @param {string} value
	 */
	public set environment(value: string) {
		this._environment = value;
	}

	/**
	 * Get the throwErrors. If true, errors will be thrown in addition to being emitted.
	 * @returns {boolean}
	 */
	public get throwErrors(): boolean {
		return this._throwErrors;
	}

	/**
	 * Set the throwErrors. If true, errors will be thrown in addition to being emitted.
	 * @param {boolean} value
	 */
	public set throwErrors(value: boolean) {
		this._throwErrors = value;
	}

	/**
	 * Get the current context. This is the default context used. You can override this at the get function level.
	 * @returns {ToggleContext}
	 */
	public get context(): ToggleContext | undefined {
		return this._context;
	}

	/**
	 * Set the context. This is the default context used. You can override this at the get function level.
	 * @param {ToggleContext} value
	 */
	public set context(value: ToggleContext | undefined) {
		this._context = value;
	}

	/**
	 * Get the URIs. This is used to override the default URIs for testing or if you are using a self-hosted version.
	 * @returns {Array<string>}
	 */
	public get uris(): string[] | undefined {
		return this._uris;
	}

	/**
	 * Set the URIs. This is used to override the default URIs for testing or if you are using a self-hosted version.
	 * @param {Array<string>} value
	 */
	public set uris(value: string[] | undefined) {
		this._uris = value;
	}

	/**
	 * Get the caching options.
	 * @returns {ToggleCachingOptions | undefined}
	 */
	public get caching(): ToggleCachingOptions | undefined {
		return this._caching;
	}

	/**
	 * Set the caching options.
	 * @param {ToggleCachingOptions | undefined} value
	 */
	public set caching(value: ToggleCachingOptions | undefined) {
		this._caching = value;
	}

	/**
	 * This is a helper function to set the public API key. It will check if the key starts with public_ and set it. If it
	 * does set it will also set the client to undefined to force a new one to be created. If it does not,
	 * it will emit an error and console warning and not set the key. Used by the constructor and publicApiKey setter.
	 * @param key
	 * @returns
	 */
	public setPublicApiKey(key: string): void {
		if (!key.startsWith("public_")) {
			this.emit("error", new Error("Public API key should start with public_"));
			if (process.env.NODE_ENV !== "production") {
				console.error("Public API key should start with public_");
			}

			return;
		}

		this._publicApiKey = key;
		this._client = undefined;
	}

	/**
	 * Set the context. This is the default context used. You can override this at the get function level.
	 * @param {ToggleContext} context
	 */
	public setContext(context: ToggleContext): void {
		this._context = context;
		// Reset the client to force a new one to be created
		this._client = undefined;
	}

	/**
	 * Helper function to get the client. This will create a new client if one does not exist. It will also set the
	 * application ID, environment, and URIs if they are not set. This is used by the get function to get the client.
	 * This is normally only used internally.
	 * @returns {Promise<Client>}
	 */
	public async getClient(): Promise<Client> {
		if (!this._client) {
			if (
				this._applicationId === undefined ||
				this._applicationId.length === 0
			) {
				const errorMessage =
					"Application ID is not set. You must set it before using the client or have the HYPHEN_APPLICATION_ID environment variable set.";
				this.emit("error", new Error(errorMessage));
				if (this._throwErrors) {
					throw new Error(errorMessage);
				}
			}

			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			const options = {
				application: this._applicationId,
				environment: this._environment,
				horizonUrls: this._uris,
				cache: this._caching,
			} as HyphenProviderOptions;

			if (this._publicApiKey && this._publicApiKey.length > 0) {
				await OpenFeature.setProviderAndWait(
					new HyphenProvider(this._publicApiKey, options),
				);
			} else {
				this.emit(
					"error",
					new Error(
						"Public API key is not set. You must set it before using the client or have the HYPHEN_PUBLIC_API_KEY environment variable set.",
					),
				);
				if (this._throwErrors) {
					throw new Error("Public API key is not set");
				}
			}

			this._client = OpenFeature.getClient(this._context);
		}

		return this._client;
	}

	/**
	 * This is the main function to get a feature flag value. It will check the type of the default value and call the
	 * appropriate function. It will also set the context if it is not set.
	 * @param {string} key - The key of the feature flag
	 * @param {T} defaultValue - The default value to return if the feature flag is not set or does not evaluate.
	 * @param {ToggleRequestOptions} options - The options to use for the request. This can be used to override the context.
	 * @returns {Promise<T>}
	 */
	public async get<T>(
		key: string,
		defaultValue: T,
		options?: ToggleGetOptions,
	): Promise<T> {
		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (typeof defaultValue) {
			case "boolean": {
				return this.getBoolean(
					key,
					defaultValue as boolean,
					options,
				) as Promise<T>;
			}

			case "string": {
				return this.getString(
					key,
					defaultValue as string,
					options,
				) as Promise<T>;
			}

			case "number": {
				return this.getNumber(
					key,
					defaultValue as number,
					options,
				) as Promise<T>;
			}

			default: {
				return this.getObject(
					key,
					defaultValue as JsonValue,
					options,
				) as Promise<T>;
			}
		}
	}

	/**
	 * Get a boolean value from the feature flag. This will check the type of the default value and call the
	 * appropriate function. It will also set the context if it is not set.
	 * @param {string} key - The key of the feature flag
	 * @param {boolean} defaultValue - The default value to return if the feature flag is not set or does not evaluate.
	 * @param {ToggleRequestOptions} options - The options to use for the request. This can be used to override the context.
	 * @returns {Promise<boolean>} - The value of the feature flag
	 */
	public async getBoolean(
		key: string,
		defaultValue: boolean,
		options?: ToggleGetOptions,
	): Promise<boolean> {
		try {
			const data = {
				key,
				defaultValue,
				options,
			};

			await this.hook(ToggleHooks.beforeGetBoolean, data);

			const client = await this.getClient();

			const result = await client.getBooleanValue(
				data.key,
				data.defaultValue,
				data.options?.context,
			);

			const resultData = {
				key,
				defaultValue,
				options,
				result,
			};
			await this.hook(ToggleHooks.afterGetBoolean, resultData);

			return resultData.result;
			/* c8 ignore next 8 */
		} catch (error) {
			this.emit("error", error);
			if (this._throwErrors) {
				throw error;
			}
		}

		return defaultValue;
	}

	/**
	 * Get a string value from the feature flag.
	 * @param {string} key - The key of the feature flag
	 * @param {string} defaultValue - The default value to return if the feature flag is not set or does not evaluate.
	 * @param {ToggleRequestOptions} options - The options to use for the request. This can be used to override the context.
	 * @returns {Promise<string>} - The value of the feature flag
	 */
	public async getString(
		key: string,
		defaultValue: string,
		options?: ToggleGetOptions,
	): Promise<string> {
		try {
			const data = {
				key,
				defaultValue,
				options,
			};
			await this.hook(ToggleHooks.beforeGetString, data);
			const client = await this.getClient();

			const result = await client.getStringValue(
				data.key,
				data.defaultValue,
				data.options?.context,
			);
			const resultData = {
				key,
				defaultValue,
				options,
				result,
			};
			await this.hook(ToggleHooks.afterGetString, resultData);
			return resultData.result;
			/* c8 ignore next 8 */
		} catch (error) {
			this.emit("error", error);
			if (this._throwErrors) {
				throw error;
			}
		}

		return defaultValue;
	}

	public async getNumber(
		key: string,
		defaultValue: number,
		options?: ToggleGetOptions,
	): Promise<number> {
		try {
			const data = {
				key,
				defaultValue,
				options,
			};
			await this.hook(ToggleHooks.beforeGetNumber, data);
			const client = await this.getClient();

			const result = await client.getNumberValue(
				data.key,
				data.defaultValue,
				data.options?.context,
			);
			const resultData = {
				key,
				defaultValue,
				options,
				result,
			};
			await this.hook(ToggleHooks.afterGetNumber, resultData);

			return resultData.result;
			/* c8 ignore next 8 */
		} catch (error) {
			this.emit("error", error);
			if (this._throwErrors) {
				throw error;
			}
		}

		return defaultValue;
	}

	/**
	 * Get an object value from the feature flag. This will check the type of the default value and call the
	 * appropriate function. It will also set the context if it is not set.
	 * @param {string} key - The key of the feature flag
	 * @param {T} defaultValue - The default value to return if the feature flag is not set or does not evaluate.
	 * @param {ToggleRequestOptions} options - The options to use for the request. This can be used to override the context.
	 * @returns {Promise<T>} - The value of the feature flag
	 */
	public async getObject<T>(
		key: string,
		defaultValue: T,
		options?: ToggleGetOptions,
	): Promise<T> {
		try {
			const data = {
				key,
				defaultValue,
				options,
			};
			await this.hook(ToggleHooks.beforeGetObject, data);
			const client = await this.getClient();

			const result = await client.getObjectValue(
				key,
				defaultValue as JsonValue,
				data.options?.context,
			);
			const resultData = {
				key,
				defaultValue,
				options,
				result,
			};
			await this.hook(ToggleHooks.afterGetObject, resultData);

			return resultData.result as T;
			/* c8 ignore next 8 */
		} catch (error) {
			this.emit("error", error);
			if (this._throwErrors) {
				throw error;
			}
		}

		return defaultValue;
	}
}
