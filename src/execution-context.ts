import { CacheableNet } from "@cacheable/net";
import { Cacheable } from "cacheable";

export type ExecutionContextOptions = {
	/**
	 * The organization ID for the Hyphen API.
	 */
	organizationId?: string;
	/**
	 * The base URI for the Hyphen API.
	 * @default "https://api.hyphen.ai"
	 */
	baseUri?: string;
	/**
	 * Whether to enable caching for the request.
	 * @default false
	 */
	cache?: boolean;
};

export type ExecutionContextRequest = {
	id?: string;
	causationId?: string;
	correlationId?: string;
};

export type ExecutionContextUser = {
	id?: string;
	name?: string;
	rules?: Record<string, unknown>[];
	type?: string;
};

export type ExecutionContextMember = {
	id?: string;
	name?: string;
	organization?: {
		id?: string;
		name?: string;
	};
	rules?: Record<string, unknown>[];
};

export type ExecutionContextOrganization = {
	id?: string;
	name?: string;
};

export type ExecutionContextLocation = {
	country?: string;
	region?: string;
	city?: string;
	lat?: number;
	lng?: number;
	postalCode?: string;
	timezone?: string;
};

export type ExecutionContext = {
	request?: ExecutionContextRequest;
	user?: ExecutionContextUser;
	member?: ExecutionContextMember;
	organization?: ExecutionContextOrganization;
	ipAddress?: string;
	location?: ExecutionContextLocation;
};

/**
 * Get the execution context for the provided API key.
 * This validates the API key and returns information about the organization, user, and request context.
 *
 * @param apiKey - The API key for the Hyphen API.
 * @param options - Additional options for the request.
 * @returns The execution context.
 * @throws Error if the API key is not provided or if the request fails.
 *
 * @example
 * ```typescript
 * import { getExecutionContext } from '@hyphen/sdk';
 *
 * const context = await getExecutionContext('your-api-key', {
 *   organizationId: 'optional-org-id',
 * });
 *
 * console.log(context.organization?.name);
 * ```
 */
export async function getExecutionContext(
	apiKey: string,
	options?: ExecutionContextOptions,
): Promise<ExecutionContext> {
	if (!apiKey) {
		throw new Error("API key is required");
	}

	const baseUri = options?.baseUri ?? "https://api.hyphen.ai";
	let url = `${baseUri}/api/execution-context`;

	if (options?.organizationId) {
		url += `?organizationId=${encodeURIComponent(options.organizationId)}`;
	}

	const net = new CacheableNet({
		cache: options?.cache ? new Cacheable() : undefined,
	});

	const response = await net.get<ExecutionContext>(url, {
		headers: {
			"x-api-key": apiKey,
			"content-type": "application/json",
			accept: "application/json",
		},
	});

	if (response.response.status !== 200) {
		throw new Error(
			`Failed to get execution context: ${response.response.statusText}`,
		);
	}

	return response.data;
}
