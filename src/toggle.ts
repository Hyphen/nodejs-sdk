import process from 'node:process';
import {Hookified} from 'hookified';
import {
	type JsonValue, OpenFeature, type Client, type EvaluationContext,
} from '@openfeature/server-sdk';
import {HyphenProvider, type HyphenProviderOptions} from '@hyphen/openfeature-server-provider';

export type Context = EvaluationContext;

export enum ToggleHooks {
	beforeGetBoolean = 'beforeGetBoolean',
	afterGetBoolean = 'afterGetBoolean',
	beforeGetString = 'beforeGetString',
	afterGetString = 'afterGetString',
	beforeGetNumber = 'beforeGetNumber',
	afterGetNumber = 'afterGetNumber',
	beforeGetObject = 'beforeGetObject',
	afterGetObject = 'afterGetObject',
}

export type ToggleOptions = {
	/**
	 * Your application name
	 * @type {string}
	 */
	applicationId: string;

	/**
	 * Your Hyphen API key
	 * @type {string}
	 */
	publicKey: string;

	/**
	 * Your environment name such as development, production. Default is what is set at NODE_ENV
	 * @type {string}
	 * @example production
	 */
	environment?: string;

	/**
	 * The context to use for evaluating feature flags
	 * @type {Context}
	 */
	context?: Context;

	caching?: {
		/**
		 * The time in seconds to cache the feature flag values
		 * @type {number} - this is in milliseconds
		 */
		ttl?: number;
	};
};

export type ToggleRequestOptions = {
	context?: Context;
};

export class Toggle extends Hookified {
	private _applicationId: string;
	private _publicKey: string;
	private _environment: string;
	private _client: Client | undefined;
	private _context: EvaluationContext | undefined;
	constructor(options: ToggleOptions) {
		super();

		this._applicationId = options.applicationId;
		this._publicKey = options.publicKey;
		this._environment = options.environment ?? process.env.NODE_ENV ?? 'development';
		this._context = options.context;
	}

	public get applicationId(): string {
		return this._applicationId;
	}

	public set applicationId(value: string) {
		this._applicationId = value;
	}

	public get publicKey(): string {
		return this._publicKey;
	}

	public set publicKey(value: string) {
		this._publicKey = value;
	}

	public get environment(): string {
		return this._environment;
	}

	public set environment(value: string) {
		this._environment = value;
	}

	public setContext(context: Context): void {
		this._context = context;
		// Reset the client to force a new one to be created
		this._client = undefined;
	}

	public async getClient(): Promise<Client> {
		if (!this._client) {
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			const options = {
				application: this._applicationId,
				environment: this._environment,
			} as HyphenProviderOptions;
			await OpenFeature.setProviderAndWait(new HyphenProvider(this._publicKey, options));
			this._client = OpenFeature.getClient(this._context);
		}

		return this._client;
	}

	public async get<T>(key: string, defaultValue: T, options?: ToggleRequestOptions): Promise<T> {
		switch (typeof defaultValue) {
			case 'boolean': {
				return this.getBoolean(key, defaultValue as boolean, options) as Promise<T>;
			}

			case 'string': {
				return this.getString(key, defaultValue as string, options) as Promise<T>;
			}

			case 'number': {
				return this.getNumber(key, defaultValue as number, options) as Promise<T>;
			}

			default: {
				return this.getObject(key, defaultValue as JsonValue, options) as Promise<T>;
			}
		}
	}

	public async getBoolean(key: string, defaultValue: boolean, options?: ToggleRequestOptions): Promise<boolean> {
		const data = {
			key,
			defaultValue,
			options,
		};

		await this.hook(ToggleHooks.beforeGetBoolean, data);

		const client = await this.getClient();

		const result = await client.getBooleanValue(data.key, data.defaultValue, data.options?.context);

		const resultData = {
			key,
			defaultValue,
			options,
			result,
		};
		await this.hook(ToggleHooks.afterGetBoolean, resultData);

		return resultData.result;
	}

	public async getString(key: string, defaultValue: string, options?: ToggleRequestOptions): Promise<string> {
		const data = {
			key,
			defaultValue,
			options,
		};
		await this.hook(ToggleHooks.beforeGetString, data);
		const client = await this.getClient();

		const result = await client.getStringValue(data.key, data.defaultValue, data.options?.context);
		const resultData = {
			key,
			defaultValue,
			options,
			result,
		};
		await this.hook(ToggleHooks.afterGetString, resultData);
		return resultData.result;
	}

	public async getNumber(key: string, defaultValue: number, options?: ToggleRequestOptions): Promise<number> {
		const data = {
			key,
			defaultValue,
			options,
		};
		await this.hook(ToggleHooks.beforeGetNumber, data);
		const client = await this.getClient();

		const result = await client.getNumberValue(data.key, data.defaultValue, data.options?.context);
		const resultData = {
			key,
			defaultValue,
			options,
			result,
		};
		await this.hook(ToggleHooks.afterGetNumber, resultData);

		return resultData.result;
	}

	public async getObject<T>(key: string, defaultValue: T, options?: ToggleRequestOptions): Promise<T> {
		const data = {
			key,
			defaultValue,
			options,
		};
		await this.hook(ToggleHooks.beforeGetObject, data);
		const client = await this.getClient();

		const result = await client.getObjectValue(key, defaultValue as JsonValue, data.options?.context);
		const resultData = {
			key,
			defaultValue,
			options,
			result,
		};
		await this.hook(ToggleHooks.afterGetObject, resultData);

		return resultData.result as T;
	}
}
