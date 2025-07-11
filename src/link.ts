import process from 'node:process';
import {BaseService, type BaseServiceOptions} from './base-service.js';
import {loadEnv} from './env.js';

loadEnv();

export const defaultLinkUris = [
	'https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/',
];

export type CreateShortCodeOptions = {
	/**
	 * The short code used for this link. If not provided, a random code will be generated.
	 * @default undefined
	 */
	code?: string;
	/**
	 * The title of the link. This is used for display purposes.
	 * @default undefined
	 */
	title?: string;
	/**
	 * The tags associated with the link. This is used for categorization purposes.
	 * @default undefined
	 */
	tags?: string[];
};

export type CreateShortCodeResponse = {
	id: string;
	code: string;
	long_url: string;
	domain: string;
	createdAt: string;
	title?: string;
	tags?: string[];
	organizationId: {
		id: string;
		name: string;
	};
};

export type GetShortCodeResponse = CreateShortCodeResponse;

export type LinkOptions = {
	/**
	 * The URIs to access the link service.
	 * @default ["https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/"]
	 */
	uris?: string[];
	/**
	 * The organization ID to use for the link service.
	 * @requires organizationId
	 */
	organizationId?: string;

	/**
	 * The API key to use for the link service. This should be provided as the service requires authentication.
	 */
	apiKey?: string;
} & BaseServiceOptions;

export class Link extends BaseService {
	private _uris: string[] = defaultLinkUris;
	private _organizationId?: string;
	private _apiKey?: string;

	constructor(options?: LinkOptions) {
		super(options);
		this._uris = options?.uris ?? defaultLinkUris;
		this._organizationId = options?.organizationId;
		if (options?.apiKey) {
			this.setApiKey(options.apiKey);
		}

		if (!this._apiKey && process.env.HYPHEN_API_KEY) {
			this.setApiKey(process.env.HYPHEN_API_KEY);
		}

		if (!this._organizationId && process.env.HYPHEN_ORGANIZATION_ID) {
			this._organizationId = process.env.HYPHEN_ORGANIZATION_ID;
		}
	}

	/**
	 * Get the URIs for the link service. The default is `["https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/"]`.
	 * @returns {string[]} The URIs for the link service.
	 */
	public get uris(): string[] {
		return this._uris;
	}

	/**
	 * Set the URIs for the link service. The default is `["https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/"]`.
	 * @param {string[]} uris - The URIs to set.
	 */
	public set uris(uris: string[]) {
		this._uris = uris;
	}

	/**
	 * Get the organization ID for the link service. This is required to access the link service.
	 * @returns {string | undefined} The organization ID.
	 */
	public get organizationId(): string | undefined {
		return this._organizationId;
	}

	/**
	 * Set the organization ID for the link service. This is required to access the link service.
	 * @param {string | undefined} organizationId - The organization ID to set.
	 */
	public set organizationId(organizationId: string | undefined) {
		this._organizationId = organizationId;
	}

	/**
	 * Get the API key for the link service. This is required to access the link service.
	 * @returns {string | undefined} The API key.
	 */
	public get apiKey(): string | undefined {
		return this._apiKey;
	}

	/**
	 * Set the API key for the link service. This is required to access the link service.
	 * @param {string | undefined} apiKey - The API key to set.
	 */
	public set apiKey(apiKey: string | undefined) {
		this.setApiKey(apiKey);
	}

	/**
	 * Set the API key for the link service. If the API key starts with 'public_', an error is thrown.
	 * This is to ensure that the API key is not a public key, which should not be used for authenticated requests.
	 * @param {string} apiKey
	 */
	public setApiKey(apiKey: string | undefined): void {
		if (apiKey?.startsWith('public_')) {
			throw new Error('API key cannot start with "public_"');
		}

		if (apiKey) {
			this._apiKey = apiKey;
		}
	}

	/**
	 * Get the URI for a specific organization and code. This is used internally to construct the URI for the link service.
	 * @param {string} organizationId The ID of the organization.
	 * @param {string} code The code to include in the URI.
	 * @returns {string} The constructed URI.
	 */
	public getUri(organizationId: string, code?: string): string {
		/* c8 ignore next 3 */
		if (!organizationId) {
			throw new Error('Organization ID is required to get the URI.');
		}

		let url = this._uris[0].replace('{organizationId}', organizationId);
		if (code) {
			url = url.endsWith('/') ? `${url}${code}/` : `${url}/${code}/`;
		}

		return url;
	}

	public async createShortCode(longUrl: string, domain: string, options?: CreateShortCodeOptions): Promise<CreateShortCodeResponse> {
		if (!this._organizationId) {
			throw new Error('Organization ID is required to create a short code.');
		}

		const url = this.getUri(this._organizationId);
		const body = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			long_url: longUrl,
			domain,
			code: options?.code,
			title: options?.title,
			tags: options?.tags,
		};

		const headers = this.createHeaders(this._apiKey);

		const response = await this.post(url, body, {headers});

		if (response.status === 201) {
			return response.data as CreateShortCodeResponse;
		}

		/* c8 ignore next 1 */
		throw new Error(`Failed to create short code: ${response.statusText}`);
	}

	/**
	 * Get a short code by its code.
	 * @param {string} code The short code to retrieve. Example: 'code_686bed403c3991bd676bba4d'
	 * @returns {Promise<GetShortCodeResponse>} A promise that resolves to the short code details.
	 */
	public async getShortCode(code: string): Promise<GetShortCodeResponse> {
		if (!this._organizationId) {
			throw new Error('Organization ID is required to get a short code.');
		}

		let url = this.getUri(this._organizationId, code);
		const headers = this.createHeaders(this._apiKey);

		const response = await this.get(url, {headers});

		if (response.status === 200) {
			return response.data as GetShortCodeResponse;
		}

		/* c8 ignore next 1 */
		throw new Error(`Failed to get short code: ${response.statusText}`);
	}

	/**
	 * Delete a short code.
	 * @param {string} code The short code to delete. Example: 'code_686bed403c3991bd676bba4d'
	 * @returns {Promise<boolean>} A promise that resolves to true if the short code was deleted successfully, or false if it was not.
	 */
	public async deleteShortCode(code: string): Promise<boolean> {
		if (!this._organizationId) {
			throw new Error('Organization ID is required to delete a short code.');
		}

		let url = this.getUri(this._organizationId, code);

		const headers = this.createHeaders(this._apiKey);
		delete headers['content-type']; // Remove content-type header for DELETE requests

		const response = await this.delete(url, {headers});

		if (response.status === 204) {
			return true;
		}

		/* c8 ignore next 1 */
		throw new Error(`Failed to delete short code: ${response.statusText}`);
	}
}
