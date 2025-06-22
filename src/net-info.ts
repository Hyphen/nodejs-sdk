import process from 'node:process';
import {BaseService, type BaseServiceOptions} from './base-service.js';
import {loadEnv} from './env.js';

loadEnv();

export type NetInfoOptions = {
	/**
     * API key for authentication. If this is not provided it will try to use `HYPHEN_API_KEY` environment variable.
     * @type {string} - The API key for authentication. This is not the public API key.
     * @default undefined
     */
	apiKey?: string;
} & BaseServiceOptions;

export class NetInfo extends BaseService {
	private _apiKey: string | undefined;
	constructor(options?: NetInfoOptions) {
		super(options);
		this.setApiKey(options?.apiKey);
		// If apiKey is not set in options, try to get it from environment variable
		if (!this._apiKey && process.env.HYPHEN_API_KEY) {
			this.setApiKey(process.env.HYPHEN_API_KEY);
		}

		if (!this._apiKey) {
			this.error('API key is required. Please provide it via options or set the HYPHEN_API_KEY environment variable.');
		}
	}

	/**
     * Gets or sets the API key for authentication.
     * If not set, it will try to use the `HYPHEN_API_KEY` environment variable.
     * @type {string | undefined}
     */
	public get apiKey(): string | undefined {
		return this._apiKey;
	}

	/**
     * Sets the API key for authentication.
     * @param {string | undefined} value - The API key to set.
     */
	public set apiKey(value: string | undefined) {
		this.setApiKey(value);
	}

	public setApiKey(value: string | undefined) {
		if (value?.startsWith('public_')) {
			this.error('The provided API key is a public API key. Please provide a valid API key for authentication.');
			return;
		}

		this._apiKey = value;
	}
}
