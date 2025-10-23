import { Buffer } from "node:buffer";
import process from "node:process";
import { BaseService, type BaseServiceOptions } from "./base-service.js";
import { env } from "./env.js";
import type { GetCodeStatsResponse } from "./link-stats-type.js";

env();

export const defaultLinkUris = [
	"https://api.hyphen.ai/api/organizations/{organizationId}/link/codes/",
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

export type UpdateShortCodeResponse = CreateShortCodeResponse;

export type UpdateShortCodeOptions = {
	/**
	 * The long URL that the short code will redirect to.
	 * @default undefined
	 */
	long_url?: string;
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

export type GetShortCodesResponse = {
	total: number;
	pageNum: number;
	pageSize: number;
	data: GetShortCodeResponse[];
};

export type GetShortCodeResponse = CreateShortCodeResponse;

export enum QrSize {
	SMALL = "small",
	MEDIUM = "medium",
	LARGE = "large",
}

export type CreateQrCodeOptions = {
	/**
	 * The title of the QR code. This is used for display purposes.
	 * @default undefined
	 */
	title?: string;
	/**
	 * The background color of the QR code. This is a hex color code.
	 * @default '#ffffff'
	 */
	backgroundColor?: string;
	/**
	 * The color of the QR code. This is a hex color code.
	 * @default '#000000'
	 */
	color?: string;
	/**
	 * The size of the QR code. This can be 'small', 'medium', or 'large'.
	 * @default QrSize.MEDIUM
	 */
	size?: QrSize;
	/**
	 * The logo to include in the QR code. This should be a base64 encoded string.
	 * @default undefined
	 */
	logo?: string;
};

export type CreateQrCodeResponse = {
	id: string;
	title?: string;
	qrCode: string;
	qrCodeBytes: Uint16Array;
	qrLink: string;
};

export type GetQrCodesResponse = {
	total: number;
	pageNum: number;
	pageSize: number;
	data: CreateQrCodeResponse[];
};

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
		if (apiKey?.startsWith("public_")) {
			throw new Error('API key cannot start with "public_"');
		}

		/* v8 ignore next -- @preserve */
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
	public getUri(
		organizationId: string,
		prefix1?: string,
		prefix2?: string,
		prefix3?: string,
	): string {
		/* v8 ignore next -- @preserve */
		if (!organizationId) {
			throw new Error("Organization ID is required to get the URI.");
		}

		let url = this._uris[0].replace("{organizationId}", organizationId);
		if (prefix1) {
			url = url.endsWith("/") ? `${url}${prefix1}/` : `${url}/${prefix1}`;
		}

		/* v8 ignore next -- @preserve */
		if (prefix2) {
			url = url.endsWith("/") ? `${url}${prefix2}/` : `${url}/${prefix2}`;
		}

		/* v8 ignore next -- @preserve */
		if (prefix3) {
			url = url.endsWith("/") ? `${url}${prefix3}/` : `${url}/${prefix3}`;
		}

		if (url.endsWith("/")) {
			url = url.slice(0, -1); // Remove trailing slash if present
		}

		return url;
	}

	/**
	 * Create a short code for a long URL.
	 * @param {string} longUrl The long URL to shorten.
	 * @param {string} domain The domain to use for the short code.
	 * @param {CreateShortCodeOptions} options Optional parameters for creating the short code.
	 * @returns {Promise<CreateShortCodeResponse>} A promise that resolves to the created short code details.
	 */
	public async createShortCode(
		longUrl: string,
		domain: string,
		options?: CreateShortCodeOptions,
	): Promise<CreateShortCodeResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to create a short code.");
		}

		const url = this.getUri(this._organizationId);
		const body = {
			long_url: longUrl,
			domain,
			code: options?.code,
			title: options?.title,
			tags: options?.tags,
		};

		const headers = this.createHeaders(this._apiKey);

		const response = await this.post(url, body, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 201) {
			return response.data as CreateShortCodeResponse;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to create short code: ${response.statusText}`);
	}

	/**
	 * Get a short code by its code.
	 * @param {string} code The short code to retrieve. Example: 'code_686bed403c3991bd676bba4d'
	 * @returns {Promise<GetShortCodeResponse>} A promise that resolves to the short code details.
	 */
	public async getShortCode(code: string): Promise<GetShortCodeResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get a short code.");
		}

		const url = this.getUri(this._organizationId, code);
		const headers = this.createHeaders(this._apiKey);

		const response = await this.get(url, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			return response.data as GetShortCodeResponse;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get short code: ${response.statusText}`);
	}

	/**
	 * Get all short codes for the organization.
	 * @param {string} titleSearch Optional search term to filter short codes by title.
	 * @param {string[]} tags Optional tags to filter short codes.
	 * @param {number} pageNumber The page number to retrieve. Default is 1.
	 * @param {number} pageSize The number of short codes per page. Default is 100.
	 * @returns {Promise<GetShortCodesResponse>} A promise that resolves to the list of short codes.
	 */
	public async getShortCodes(
		titleSearch: string,
		tags?: string[],
		pageNumber = 1,
		pageSize = 100,
	): Promise<GetShortCodesResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get short codes.");
		}

		const url = this.getUri(this._organizationId);
		const headers = this.createHeaders(this._apiKey);

		const parameters: Record<string, string> = {};
		if (titleSearch) {
			parameters.title = titleSearch;
		}

		if (tags && tags.length > 0) {
			parameters.tags = tags.join(",");
		}

		parameters.pageNum = pageNumber.toString();
		parameters.pageSize = pageSize.toString();

		const response = await this.get(url, { headers, params: parameters });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			return response.data as GetShortCodesResponse;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get short codes: ${response.statusText}`);
	}

	/**
	 * Get all tags associated with the organization's short codes.
	 * @returns {Promise<string[]>} A promise that resolves to an array of tags.
	 */
	public async getTags(): Promise<string[]> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get tags.");
		}

		const url = this.getUri(this._organizationId, "tags");
		const headers = this.createHeaders(this._apiKey);

		const response = await this.get(url, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			return response.data as string[];
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get tags: ${response.statusText}`);
	}

	/**
	 * Get statistics for a specific short code.
	 * @param code The short code to retrieve statistics for.
	 * @returns {Promise<GetCodeStatsResponse>} A promise that resolves to the code statistics.
	 */
	public async getCodeStats(
		code: string,
		startDate: Date,
		endDate: Date,
	): Promise<GetCodeStatsResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get code stats.");
		}

		const url = this.getUri(this._organizationId, code, "stats");
		const headers = this.createHeaders(this._apiKey);

		const parameters: Record<string, string> = {
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		};

		const response = await this.get(url, { headers, params: parameters });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			return response.data as GetCodeStatsResponse;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get code stats: ${response.statusText}`);
	}

	/**
	 * Update a short code.
	 * @param {string} code The short code to update. Example: 'code_686bed403c3991bd676bba4d'
	 * @param {UpdateShortCodeOptions} options The options to update the short code with.
	 * @returns {Promise<UpdateShortCodeResponse>} A promise that resolves to the updated short code details.
	 */
	public async updateShortCode(
		code: string,
		options: UpdateShortCodeOptions,
	): Promise<UpdateShortCodeResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to update a short code.");
		}

		const url = this.getUri(this._organizationId, code);
		const headers = this.createHeaders(this._apiKey);

		const response = await this.patch(url, options, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			return response.data as UpdateShortCodeResponse;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to update short code: ${response.statusText}`);
	}

	/**
	 * Delete a short code.
	 * @param {string} code The short code to delete. Example: 'code_686bed403c3991bd676bba4d'
	 * @returns {Promise<boolean>} A promise that resolves to true if the short code was deleted successfully, or false if it was not.
	 */
	public async deleteShortCode(code: string): Promise<boolean> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to delete a short code.");
		}

		const url = this.getUri(this._organizationId, code);

		const headers = this.createHeaders(this._apiKey);

		const response = await this.delete(url, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 204) {
			return true;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to delete short code: ${response.statusText}`);
	}

	/**
	 * Create a QR code for a specific short code.
	 * @param {string} code The short code to create a QR code for.
	 * @param {CreateQrCodeOptions} options The options for creating the QR code.
	 * @returns {Promise<CreateQrCodeResponse>} A promise that resolves to the created QR code details.
	 */
	public async createQrCode(
		code: string,
		options?: CreateQrCodeOptions,
	): Promise<CreateQrCodeResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to create a QR code.");
		}

		const url = this.getUri(this._organizationId, code, "qrs");
		const headers = this.createHeaders(this._apiKey);

		// biome-ignore lint/suspicious/noExplicitAny: this is valid for body
		const body: Record<string, any> = {
			title: options?.title,
			backgroundColor: options?.backgroundColor,
			color: options?.color,
			size: options?.size,
			logo: options?.logo,
		};

		const response = await this.post(url, body, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 201) {
			const result = response.data as CreateQrCodeResponse;

			if (result.qrCode) {
				const buffer = Buffer.from(result.qrCode, "base64");
				result.qrCodeBytes = new Uint16Array(buffer);
			}

			return result;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to create QR code: ${response.statusText}`);
	}

	/**
	 * Get a QR code by its ID.
	 * @param code The short code associated with the QR code.
	 * @param qr The ID of the QR code to retrieve.
	 * @returns The details of the requested QR code.
	 */
	public async getQrCode(
		code: string,
		qr: string,
	): Promise<CreateQrCodeResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get a QR code.");
		}

		const url = this.getUri(this._organizationId, code, "qrs", qr);
		const headers = this.createHeaders(this._apiKey);

		const response = await this.get(url, { headers });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			const result = response.data as CreateQrCodeResponse;

			if (result.qrCode) {
				const buffer = Buffer.from(result.qrCode, "base64");
				result.qrCodeBytes = new Uint16Array(buffer);
			}

			return result;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get QR code: ${response.statusText}`);
	}

	public async getQrCodes(
		code: string,
		pageNumber?: number,
		pageSize?: number,
	): Promise<GetQrCodesResponse> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to get QR codes.");
		}

		const url = this.getUri(this._organizationId, code, "qrs");
		const headers = this.createHeaders(this._apiKey);

		const parameters: Record<string, string> = {};
		if (pageNumber) {
			parameters.pageNum = pageNumber.toString();
		}

		if (pageSize) {
			parameters.pageSize = pageSize.toString();
		}

		const response = await this.get(url, { headers, params: parameters });

		/* v8 ignore next -- @preserve */
		if (response.status === 200) {
			const result = response.data as GetQrCodesResponse;
			for (const qrCode of result.data) {
				if (qrCode.qrCode) {
					const buffer = Buffer.from(qrCode.qrCode, "base64");
					qrCode.qrCodeBytes = new Uint16Array(buffer);
				}
			}

			return result;
		}

		/* v8 ignore next -- @preserve */
		throw new Error(`Failed to get QR codes: ${response.statusText}`);
	}

	/**
	 * Delete a QR code by its ID.
	 * @param {string} code The short code associated with the QR code.
	 * @param {string} qr The ID of the QR code to delete.
	 * @returns {Promise<boolean>} A promise that resolves to true if the QR code was deleted successfully, or false if it was not.
	 */
	public async deleteQrCode(code: string, qr: string): Promise<boolean> {
		if (!this._organizationId) {
			throw new Error("Organization ID is required to delete a QR code.");
		}

		const url = this.getUri(this._organizationId, code, "qrs", qr);

		const headers = this.createHeaders(this._apiKey);

		const response = await this.delete(url, { headers });

		if (response.status === 204) {
			return true;
			/* v8 ignore next 1 -- @preserve */
		}

		/* v8 ignore next 1 -- @preserve */
		throw new Error(`Failed to delete QR code: ${response.statusText}`);
	}
}
