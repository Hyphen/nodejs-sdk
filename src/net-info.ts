import process from "node:process";
import {
	BaseService,
	type BaseServiceOptions,
	ErrorMessages,
} from "./base-service.js";
import { env } from "./env.js";

env();

export enum NetInfoErrors {
	INVALID_IPS_ARRAY = "The provided IPs array is invalid. It should be a non-empty array of strings.",
}

export type NetInfoOptions = {
	/**
	 * API key for authentication. If this is not provided it will try to use `HYPHEN_API_KEY` environment variable.
	 * @type {string} - The API key for authentication. This is not the public API key.
	 * @default undefined
	 */
	apiKey?: string;

	/**
	 * Base URI for the API. If not provided, it will use the default Hyphen API base URI.
	 * @type {string} - The base URI for the API.
	 * @default 'https://net.info'
	 */
	baseUri?: string;
} & BaseServiceOptions;

export type ipInfo = {
	ip: string;
	type: string;
	location: {
		country: string;
		region: string;
		city: string;
		lat: number;
		lng: number;
		postalCode: string;
		timezone: string;
		geonameId: number;
	};
};

export type ipInfoError = {
	ip: string;
	type: string;
	errorMessage: string;
};

export class NetInfo extends BaseService {
	private _apiKey: string | undefined;
	private _baseUri = "https://net.info";
	constructor(options?: NetInfoOptions) {
		super(options);

		if (options?.baseUri) {
			this._baseUri = options.baseUri;
		}

		this.setApiKey(options?.apiKey);
		// If apiKey is not set in options, try to get it from environment variable
		if (!this._apiKey && process.env.HYPHEN_API_KEY) {
			this.setApiKey(process.env.HYPHEN_API_KEY);
		}

		if (!this._apiKey) {
			this.error(ErrorMessages.API_KEY_REQUIRED);
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

	/**
	 * Gets or sets the base URI for the API.
	 * @type {string}
	 */
	public get baseUri(): string {
		return this._baseUri;
	}

	/**
	 * Sets the base URI for the API.
	 * @param {string} value - The base URI to set.
	 */
	public set baseUri(value: string) {
		this._baseUri = value;
	}

	public setApiKey(value: string | undefined) {
		if (value?.startsWith("public_")) {
			this.error(ErrorMessages.PUBLIC_API_KEY_SHOULD_NOT_BE_USED);
			return;
		}

		this._apiKey = value;
	}

	/**
	 * Fetches GeoIP information for a given IP address.
	 * @param {string} ip - The IP address to fetch GeoIP information for.
	 * @returns {Promise<ipInfo | ipInfoError>} - A promise that resolves to the ip information or an error.
	 */
	public async getIpInfo(ip: string): Promise<ipInfo | ipInfoError> {
		try {
			/* v8 ignore next -- @preserve */
			if (!this._apiKey) {
				throw new Error(ErrorMessages.API_KEY_REQUIRED);
			}

			const url = `${this._baseUri}/ip/${ip}`;
			const headers = this.createHeaders(this._apiKey);
			const response = await this.get(url, {
				headers,
			});

			/* v8 ignore next -- @preserve */
			if (response.status !== 200) {
				const errorResult: ipInfoError = {
					ip,
					type: "error",
					errorMessage: `Failed to fetch ip info: ${response.statusText}`,
				};
				return errorResult;
			}

			return response.data as ipInfo;
		} catch (error) {
			/* v8 ignore next -- @preserve */
			this.error(
				`Failed to fetch ip info: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			const errorResult: ipInfoError = {
				ip,
				type: "error",
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			};
			return errorResult;
		}
	}

	public async getIpInfos(ips: string[]): Promise<Array<ipInfo | ipInfoError>> {
		if (!Array.isArray(ips) || ips.length === 0) {
			this.error(NetInfoErrors.INVALID_IPS_ARRAY);
			return [];
		}

		const errorResults: Array<ipInfo | ipInfoError> = [];
		try {
			/* v8 ignore next -- @preserve */
			if (!this._apiKey) {
				throw new Error(ErrorMessages.API_KEY_REQUIRED);
			}

			const url = `${this._baseUri}/ip`;
			const headers = this.createHeaders(this._apiKey);
			const response = await this.post(url, ips, {
				headers,
			});

			/* v8 ignore next -- @preserve */
			if (response.status !== 200) {
				errorResults.push({
					ip: "",
					type: "error",
					errorMessage: `Failed to fetch ip infos: ${response.statusText}`,
				});
				return errorResults;
			}

			const responseData = response?.data as {
				data: Array<ipInfo | ipInfoError>;
			};
			return responseData.data;
		} catch (error) {
			/* v8 ignore next -- @preserve */
			this.error(
				`Failed to fetch ip infos: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			/* v8 ignore next -- @preserve */
			errorResults.push({
				ip: "",
				type: "error",
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			});

			/* v8 ignore next -- @preserve */
			return errorResults;
		}
	}
}
