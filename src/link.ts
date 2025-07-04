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
	organizationId: string;
} & BaseServiceOptions;

export class Link extends BaseService {
	private _uris: string[] = defaultLinkUris;
	private _organizationId: string;

	constructor(options?: LinkOptions) {
		super(options);
		this._uris = options?.uris ?? defaultLinkUris;
		this._organizationId = options?.organizationId ?? '';
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
}
