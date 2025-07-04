import {BaseService, type BaseServiceOptions} from './base-service.js';

export const defaultLinkUris = [
	'https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/',
];

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
	private _organizationId: string;
	private _apiKey = '';

	constructor(options?: LinkOptions) {
		super(options);
		this._uris = options?.uris ?? defaultLinkUris;
		this._organizationId = options?.organizationId ?? '';
		if (options?.apiKey) {
			this.setApiKey(options.apiKey);
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
     * @returns {string} The organization ID.
     */
	public get organizationId(): string {
		return this._organizationId;
	}

	/**
     * Set the organization ID for the link service. This is required to access the link service.
     * @param {string} organizationId - The organization ID to set.
     */
	public set organizationId(organizationId: string) {
		this._organizationId = organizationId;
	}

	/**
     * Get the API key for the link service. This is required to access the link service.
     * @returns {string} The API key.
     */
	public get apiKey(): string {
		return this._apiKey;
	}

	/**
     * Set the API key for the link service. This is required to access the link service.
     * @param {string} apiKey - The API key to set.
     */
	public set apiKey(apiKey: string) {
		this.setApiKey(apiKey);
	}

	/**
     * Set the API key for the link service. If the API key starts with 'public_', an error is thrown.
     * This is to ensure that the API key is not a public key, which should not be used for authenticated requests.
     * @param {string} apiKey
     */
	public setApiKey(apiKey: string): void {
		if (apiKey.startsWith('public_')) {
			throw new Error('API key cannot start with "public_"');
		}

		this._apiKey = apiKey;
	}
}
