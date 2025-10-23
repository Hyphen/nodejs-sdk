import { CacheableNet, type FetchOptions } from "@cacheable/net";
import type { Cacheable } from "cacheable";
import { Hookified } from "hookified";

/**
 * Custom attributes that can contain any key-value pairs.
 */
export type CustomAttributes = Record<string, unknown>;

/**
 * User information for evaluation context.
 */
export type ToggleUser = {
	/**
	 * Unique identifier for the user.
	 */
	id: string;

	/**
	 * User's email address.
	 */
	email?: string;

	/**
	 * User's display name.
	 */
	name?: string;

	/**
	 * Custom attributes specific to the user.
	 */
	customAttributes?: CustomAttributes;
};

/**
 * Evaluation context for Hyphen feature toggle evaluation.
 *
 * @example
 * ```typescript
 * const context: ToggleContext = {
 *   targetingKey: "user-123",
 *   ipAddress: "203.0.113.42",
 *   customAttributes: {
 *     subscriptionLevel: "premium",
 *     region: "us-east",
 *   },
 *   user: {
 *     id: "user-123",
 *     email: "john.doe@example.com",
 *     name: "John Doe",
 *     customAttributes: {
 *       role: "admin",
 *     },
 *   },
 * };
 * ```
 */
export type ToggleContext = {
	/**
	 * Primary key used for targeting and bucketing.
	 */
	targetingKey?: string;

	/**
	 * IP address of the user making the request.
	 */
	ipAddress?: string;

	/**
	 * Custom attributes for evaluation context.
	 */
	customAttributes?: CustomAttributes;

	/**
	 * User information for evaluation.
	 */
	user?: ToggleUser;
};

/**
 * Internal type combining application info with toggle context for evaluation.
 */
export type ToggleEvaluation = {
	application: string;
	environment: string;
} & ToggleContext;

/**
 * Represents a single toggle evaluation result.
 */
export interface Evaluation {
	/**
	 * The toggle key.
	 */
	key: string;

	/**
	 * The evaluated value of the toggle.
	 */
	value: boolean | string | number | Record<string, unknown>;

	/**
	 * The type of the toggle value.
	 */
	type: "boolean" | "string" | "number" | "object";

	/**
	 * Optional reason for the evaluation result.
	 */
	reason?: unknown;

	/**
	 * Error message if evaluation failed.
	 */
	errorMessage?: string;
}

/**
 * Response from the toggle evaluation API.
 */
export interface EvaluationResponse {
	/**
	 * Map of toggle keys to their evaluation results.
	 */
	toggles: Record<string, Evaluation>;
}

/**
 * Options for toggle getter methods.
 */
export type GetOptions = {
	/**
	 * Override the default context for this request.
	 */
	context?: ToggleContext;

	/**
	 * Whether to use caching for this request (if caching is configured).
	 */
	cache?: boolean;
};

/**
 * Events emitted by the Toggle class.
 */
export enum ToggleEvents {
	/**
	 * Emitted when an error occurs during toggle evaluation.
	 */
	Error = "error",
}

/**
 * Configuration options for the Toggle class.
 */
export type ToggleOptions = {
	/**
	 * Public API key for authentication.
	 * Can be found in your Hyphen dashboard.
	 * Must start with "public_".
	 */
	publicApiKey?: string;

	/**
	 * The default context to use when one is not passed to getter methods.
	 * Can be overridden per-request using the GetOptions parameter.
	 */
	defaultContext?: ToggleContext;

	/**
	 * Horizon endpoint URLs for load balancing and failover.
	 * If provided, requests will be attempted in order. If all fail,
	 * defaults to Hyphen's hosted service.
	 * @see {@link https://hyphen.ai/horizon} for more information
	 */
	horizonUrls?: string[];

	/**
	 * Application ID for your Hyphen project.
	 * Can be found in your Hyphen dashboard.
	 */
	applicationId?: string;

	/**
	 * Environment name (e.g., "production", "development", "staging").
	 * Defaults to "development" if not provided.
	 */
	environment?: string;

	/**
	 * Default targeting key to use if one cannot be derived from context.
	 * If not provided, a random key will be generated.
	 */
	defaultTargetKey?: string;

	cache?: Cacheable;
};

/**
 * Toggle class for feature flag management with Hyphen.
 *
 * This class provides methods to retrieve feature toggle values with support for
 * multiple value types (boolean, string, number, object), context-based targeting,
 * and load-balanced requests across multiple Horizon endpoints.
 *
 * @extends Hookified - Provides event and hook system capabilities
 *
 * @example
 * Basic usage:
 * ```typescript
 * const toggle = new Toggle({
 *   publicApiKey: 'public_your-key-here',
 *   applicationId: 'app-123',
 *   environment: 'production'
 * });
 *
 * const isEnabled = await toggle.getBoolean('new-feature', false);
 * ```
 *
 * @example
 * With context:
 * ```typescript
 * const toggle = new Toggle({
 *   publicApiKey: 'public_your-key-here',
 *   applicationId: 'app-123',
 *   defaultContext: {
 *     targetingKey: 'user-456',
 *     user: { id: 'user-456', email: 'user@example.com' }
 *   }
 * });
 *
 * const message = await toggle.getString('welcome-message', 'Hello!');
 * ```
 *
 * @example
 * With error handling:
 * ```typescript
 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app' });
 *
 * toggle.on('error', (error) => {
 *   console.error('Toggle error:', error);
 * });
 *
 * const value = await toggle.getNumber('max-items', 10);
 * ```
 */
export class Toggle extends Hookified {
	private _publicApiKey?: string;
	private _organizationId: string | undefined;
	private _applicationId: string | undefined;
	private _environment: string | undefined;
	private _horizonUrls: string[] = [];

	private _net: CacheableNet = new CacheableNet();
	private _defaultContext: ToggleContext | undefined;
	private _defaultTargetingKey: string =
		`${Math.random().toString(36).substring(7)}`;

	/**
	 * Creates a new Toggle instance.
	 *
	 * @param options - Configuration options for the toggle client
	 *
	 * @example
	 * ```typescript
	 * // Minimal configuration
	 * const toggle = new Toggle({
	 *   publicApiKey: 'public_your-key',
	 *   applicationId: 'app-123'
	 * });
	 *
	 * // With full options
	 * const toggle = new Toggle({
	 *   publicApiKey: 'public_your-key',
	 *   applicationId: 'app-123',
	 *   environment: 'production',
	 *   defaultContext: { targetingKey: 'user-456' },
	 *   horizonUrls: ['https://my-horizon.example.com']
	 * });
	 * ```
	 */
	constructor(options?: ToggleOptions) {
		super();

		if (options?.applicationId) {
			this._applicationId = options.applicationId;
		}

		if (options?.environment) {
			this._environment = options.environment;
		} else {
			this._environment = "development";
		}

		if (options?.defaultContext) {
			this._defaultContext = options.defaultContext;
		}

		if (options?.publicApiKey) {
			this._publicApiKey = options.publicApiKey;
			this._organizationId = this.getOrgIdFromPublicKey(this._publicApiKey);
		}

		if (options?.horizonUrls) {
			this._horizonUrls = options.horizonUrls;
		} else {
			this._horizonUrls = this.getDefaultHorizonUrls(this._publicApiKey);
		}

		if (options?.defaultTargetKey) {
			this._defaultTargetingKey = options?.defaultTargetKey;
		} else {
			if (this._defaultContext) {
				this._defaultTargetingKey = this.getTargetingKey(this._defaultContext);
			} else {
				this._defaultTargetingKey = this.generateTargetKey();
			}
		}

		if (options?.cache) {
			this._net.cache = options.cache;
		}
	}

	/**
	 * Gets the public API key used for authentication.
	 *
	 * @returns The current public API key or undefined if not set
	 */
	public get publicApiKey(): string | undefined {
		return this._publicApiKey;
	}

	/**
	 * Sets the public API key used for authentication.
	 *
	 * @param value - The public API key string or undefined to clear
	 * @throws {Error} If the key doesn't start with "public_"
	 */
	public set publicApiKey(value: string | undefined) {
		this.setPublicKey(value);
	}

	/**
	 * Gets the default context used for toggle evaluations.
	 *
	 * @returns The current default ToggleContext
	 */
	public get defaultContext(): ToggleContext | undefined {
		return this._defaultContext;
	}

	/**
	 * Sets the default context used for toggle evaluations.
	 *
	 * @param value - The ToggleContext to use as default
	 */
	public set defaultContext(value: ToggleContext) {
		this._defaultContext = value;
	}

	/**
	 * Gets the organization ID extracted from the public API key.
	 *
	 * @returns The organization ID string or undefined if not available
	 */
	public get organizationId(): string | undefined {
		return this._organizationId;
	}

	/**
	 * Gets the Horizon endpoint URLs used for load balancing.
	 *
	 * These URLs are used to distribute requests across multiple Horizon endpoints.
	 * If endpoints fail, the system will attempt to use the default horizon endpoint service.
	 *
	 * @returns Array of Horizon endpoint URLs
	 * @see {@link https://hyphen.ai/horizon} for more information
	 */
	public get horizonUrls(): string[] {
		return this._horizonUrls;
	}

	/**
	 * Sets the Horizon endpoint URLs for load balancing.
	 *
	 * Configures multiple Horizon endpoints that will be used for load balancing.
	 * When endpoints fail, the system will fall back to the default horizon endpoint service.
	 *
	 * @param value - Array of Horizon endpoint URLs or empty array to clear
	 * @see {@link https://hyphen.ai/horizon} for more information
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle();
	 * toggle.horizonUrls = [
	 *   'https://org1.toggle.hyphen.cloud',
	 *   'https://org2.toggle.hyphen.cloud'
	 * ];
	 * ```
	 */
	public set horizonUrls(value: string[]) {
		this._horizonUrls = value;
	}

	/**
	 * Gets the application ID used for toggle context.
	 *
	 * @returns The current application ID or undefined if not set
	 */
	public get applicationId(): string | undefined {
		return this._applicationId;
	}

	/**
	 * Sets the application ID used for toggle context.
	 *
	 * @param value - The application ID string or undefined to clear
	 */
	public set applicationId(value: string | undefined) {
		this._applicationId = value;
	}

	/**
	 * Gets the environment used for toggle context.
	 *
	 * @returns The current environment (defaults to 'development')
	 */
	public get environment(): string | undefined {
		return this._environment;
	}

	/**
	 * Sets the environment used for toggle context.
	 *
	 * @param value - The environment string or undefined to clear
	 */
	public set environment(value: string | undefined) {
		this._environment = value;
	}

	/**
	 * Gets the default targeting key used for toggle evaluations.
	 *
	 * @returns The current default targeting key or undefined if not set
	 */
	public get defaultTargetingKey(): string {
		return this._defaultTargetingKey;
	}

	/**
	 * Sets the default targeting key used for toggle evaluations.
	 *
	 * @param value - The targeting key string or undefined to clear
	 */
	public set defaultTargetingKey(value: string) {
		this._defaultTargetingKey = value;
	}

	/**
	 * Gets the Cacheable instance used for caching fetch operations.
	 *
	 * @returns The current Cacheable instance
	 */
	public get cache(): Cacheable {
		return this._net.cache;
	}

	/**
	 * Sets the Cacheable instance for caching fetch operations.
	 *
	 * @param cache - The Cacheable instance to use for caching
	 */
	public set cache(cache: Cacheable) {
		this._net.cache = cache;
	}

	/**
	 * Retrieves a toggle value with generic type support.
	 *
	 * This is the core method for fetching toggle values. All convenience methods
	 * (getBoolean, getString, getNumber, getObject) delegate to this method.
	 *
	 * @template T - The expected type of the toggle value
	 * @param toggleKey - The key of the toggle to retrieve
	 * @param defaultValue - The value to return if the toggle is not found or an error occurs
	 * @param options - Optional configuration including context override
	 * @returns Promise resolving to the toggle value or defaultValue
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app-id' });
	 *
	 * // Get a boolean
	 * const enabled = await toggle.get<boolean>('feature-flag', false);
	 *
	 * // Get an object with type safety
	 * interface Config { theme: string; }
	 * const config = await toggle.get<Config>('app-config', { theme: 'light' });
	 *
	 * // Override context for a single request
	 * const value = await toggle.get('key', 'default', {
	 *   context: { targetingKey: 'user-456' }
	 * });
	 * ```
	 */
	public async get<T>(
		toggleKey: string,
		defaultValue: T,
		options?: GetOptions,
	): Promise<T> {
		try {
			const context: ToggleEvaluation = {
				application: this._applicationId ?? "",
				environment: this._environment ?? "development",
			};

			if (options?.context) {
				context.targetingKey = options?.context.targetingKey;
				context.ipAddress = options?.context.ipAddress;
				context.user = options?.context.user;
				context.customAttributes = options?.context.customAttributes;
			} else {
				context.targetingKey = this._defaultContext?.targetingKey;
				context.ipAddress = this._defaultContext?.ipAddress;
				context.user = this._defaultContext?.user;
				context.customAttributes = this._defaultContext?.customAttributes;
			}

			const fetchOptions = { headers: {} as Record<string, string> };

			if (!context.targetingKey) {
				context.targetingKey = this.getTargetingKey(context);
			}

			// api key
			if (this._publicApiKey) {
				fetchOptions.headers["x-api-key"] = this._publicApiKey;
			} else {
				throw new Error("You must set the publicApiKey");
			}

			// application
			if (context.application === "") {
				throw new Error("You must set the applicationId");
			}

			const result = await this.fetch<EvaluationResponse>(
				"/toggle/evaluate",
				context,
				fetchOptions,
			);

			if (result?.toggles) {
				return result.toggles[toggleKey].value as T;
			}
		} catch (error) {
			this.emit(ToggleEvents.Error, error);
		}

		return defaultValue;
	}

	/**
	 * Retrieves a boolean toggle value.
	 *
	 * This is a convenience method that wraps the generic get() method with boolean type safety.
	 *
	 * @param toggleKey - The key of the toggle to retrieve
	 * @param defaultValue - The boolean value to return if the toggle is not found or an error occurs
	 * @param options - Optional configuration including context for toggle evaluation
	 * @returns Promise resolving to the boolean toggle value or defaultValue
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app-id' });
	 * const isFeatureEnabled = await toggle.getBoolean('feature-flag', false);
	 * console.log(isFeatureEnabled); // true or false
	 * ```
	 */
	public async getBoolean(
		toggleKey: string,
		defaultValue: boolean,
		options?: GetOptions,
	): Promise<boolean> {
		return this.get<boolean>(toggleKey, defaultValue, options);
	}

	/**
	 * Retrieves a string toggle value.
	 *
	 * This is a convenience method that wraps the generic get() method with string type safety.
	 *
	 * @param toggleKey - The key of the toggle to retrieve
	 * @param defaultValue - The string value to return if the toggle is not found or an error occurs
	 * @param options - Optional configuration including context for toggle evaluation
	 * @returns Promise resolving to the string toggle value or defaultValue
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app-id' });
	 * const message = await toggle.getString('welcome-message', 'Hello World');
	 * console.log(message); // 'Welcome to our app!' or 'Hello World'
	 * ```
	 */
	public async getString(
		toggleKey: string,
		defaultValue: string,
		options?: GetOptions,
	): Promise<string> {
		return this.get<string>(toggleKey, defaultValue, options);
	}

	/**
	 * Retrieves an object toggle value.
	 *
	 * This is a convenience method that wraps the generic get() method with object type safety.
	 * Note that the toggle service may return JSON as a string, which should be parsed if needed.
	 *
	 * @template T - The expected object type
	 * @param toggleKey - The key of the toggle to retrieve
	 * @param defaultValue - The object value to return if the toggle is not found or an error occurs
	 * @param options - Optional configuration including context for toggle evaluation
	 * @returns Promise resolving to the object toggle value or defaultValue
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app-id' });
	 * const config = await toggle.getObject('app-config', { theme: 'light' });
	 * console.log(config); // { theme: 'dark', features: ['a', 'b'] } or { theme: 'light' }
	 * ```
	 */
	public async getObject<T extends object>(
		toggleKey: string,
		defaultValue: T,
		options?: GetOptions,
	): Promise<T> {
		return this.get<T>(toggleKey, defaultValue, options);
	}

	/**
	 * Retrieves a number toggle value.
	 *
	 * This is a convenience method that wraps the generic get() method with number type safety.
	 *
	 * @param toggleKey - The key of the toggle to retrieve
	 * @param defaultValue - The number value to return if the toggle is not found or an error occurs
	 * @param options - Optional configuration including context for toggle evaluation
	 * @returns Promise resolving to the number toggle value or defaultValue
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({ publicApiKey: 'public_key', applicationId: 'app-id' });
	 * const maxRetries = await toggle.getNumber('max-retries', 3);
	 * console.log(maxRetries); // 5 or 3
	 * ```
	 */
	public async getNumber(
		toggleKey: string,
		defaultValue: number,
		options?: GetOptions,
	): Promise<number> {
		return this.get<number>(toggleKey, defaultValue, options);
	}

	/**
	 * Makes an HTTP POST request to the specified URL with automatic authentication.
	 *
	 * This method uses browser-compatible fetch and automatically includes the
	 * public API key in the x-api-key header if available. It supports load
	 * balancing across multiple horizon URLs with fallback behavior.
	 *
	 * @template T - The expected response type
	 * @param path - The API path to request (e.g., '/api/toggles')
	 * @param payload - The JSON payload to send in the request body
	 * @param options - Optional fetch configuration. Cache is set at .cache
	 * @returns Promise resolving to the parsed JSON response
	 * @throws {Error} If no horizon URLs are configured or all requests fail
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle({
	 *   publicApiKey: 'public_your-key-here',
	 *   horizonUrls: ['https://api.hyphen.cloud']
	 * });
	 *
	 * interface ToggleResponse {
	 *   enabled: boolean;
	 *   value: string;
	 * }
	 *
	 * const result = await toggle.fetch<ToggleResponse>('/api/toggle/feature-flag', {
	 *   context: { targetingKey: 'user-123' }
	 * });
	 * console.log(result.enabled); // true/false
	 * ```
	 */
	public async fetch<T>(
		path: string,
		payload?: unknown,
		options?: Omit<FetchOptions, "cache">,
	): Promise<T> {
		if (this._horizonUrls.length === 0) {
			throw new Error(
				"No horizon URLs configured. Set horizonUrls or provide a valid publicApiKey.",
			);
		}

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (options?.headers) {
			if (options.headers instanceof Headers) {
				options.headers.forEach((value, key) => {
					headers[key] = value;
				});
			} else if (Array.isArray(options.headers)) {
				options.headers.forEach(([key, value]) => {
					headers[key] = value;
				});
			} else {
				Object.assign(headers, options.headers);
			}
		}

		if (this._publicApiKey) {
			headers["x-api-key"] = this._publicApiKey;
		}

		const fetchOptions: FetchOptions = {
			method: "POST",
			...options,
			headers,
			body: payload ? JSON.stringify(payload) : options?.body,
		};

		const errors: Error[] = [];

		for (const baseUrl of this._horizonUrls) {
			try {
				const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
				const response = await this._net.fetch(url, fetchOptions);

				/* v8 ignore next 3 */
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = (await response.json()) as T;
				return data;
			} catch (error) {
				const fetchError =
					error instanceof Error ? error : new Error("Unknown fetch error");

				// Extract status code from CacheableNet error messages
				const statusMatch = fetchError.message.match(/status (\d{3})/);
				if (statusMatch) {
					const status = statusMatch[1];
					errors.push(new Error(`HTTP ${status}: ${fetchError.message}`));
				} else {
					errors.push(fetchError);
				}
			}
		}

		throw new Error(
			`All horizon URLs failed. Last errors: ${errors.map((e) => e.message).join(", ")}`,
		);
	}

	/**
	 * Validates and sets the public API key.
	 *
	 * This method is used internally by the publicApiKey setter to validate
	 * that the key starts with "public_" prefix. If the key is invalid,
	 * an error is thrown.
	 *
	 * @param key - The public API key string or undefined to clear
	 * @throws {Error} If the key doesn't start with "public_"
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle();
	 *
	 * // Valid key
	 * toggle.setPublicKey('public_abc123'); // OK
	 *
	 * // Invalid key
	 * toggle.setPublicKey('invalid_key'); // Throws error
	 *
	 * // Clear key
	 * toggle.setPublicKey(undefined); // OK
	 * ```
	 */
	public setPublicKey(key: string | undefined): void {
		if (key !== undefined && !key.startsWith("public_")) {
			throw new Error("Public API key must start with 'public_'");
		}
		this._publicApiKey = key;
	}

	/**
	 * Extracts the organization ID from a public API key.
	 *
	 * The public key format is: `public_<base64-encoded-data>`
	 * The base64 data contains: `orgId:secretData`
	 * Only alphanumeric characters, underscores, and hyphens are considered valid in org IDs.
	 *
	 * @param publicKey - The public API key to extract the organization ID from
	 * @returns The organization ID if valid and extractable, undefined otherwise
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle();
	 * const orgId = toggle.getOrgIdFromPublicKey('public_dGVzdC1vcmc6c2VjcmV0');
	 * console.log(orgId); // 'test-org'
	 * ```
	 */
	public getOrgIdFromPublicKey(publicKey: string): string | undefined {
		try {
			const keyWithoutPrefix = publicKey.replace(/^public_/, "");
			const decoded = globalThis.atob
				? globalThis.atob(keyWithoutPrefix)
				: Buffer.from(keyWithoutPrefix, "base64").toString();
			const [orgId] = decoded.split(":");
			const isValidOrgId = /^[a-zA-Z0-9_-]+$/.test(orgId);
			return isValidOrgId ? orgId : undefined;
		} catch {
			return undefined;
		}
	}

	/**
	 * Builds the default Horizon API URL for the given public key.
	 *
	 * If a valid organization ID can be extracted from the public key, returns an
	 * organization-specific URL. Otherwise, returns the default fallback URL.
	 *
	 * @param publicKey - The public API key to build the URL for
	 * @returns Organization-specific URL or default fallback URL
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle();
	 *
	 * // With valid org ID
	 * const orgUrl = toggle.buildDefaultHorizonUrl('public_dGVzdC1vcmc6c2VjcmV0');
	 * console.log(orgUrl); // 'https://test-org.toggle.hyphen.cloud'
	 *
	 * // With invalid key
	 * const defaultUrl = toggle.buildDefaultHorizonUrl('invalid-key');
	 * console.log(defaultUrl); // 'https://toggle.hyphen.cloud'
	 * ```
	 */
	public getDefaultHorizonUrl(publicKey?: string): string {
		if (publicKey) {
			const orgId = this.getOrgIdFromPublicKey(publicKey);
			return orgId
				? `https://${orgId}.toggle.hyphen.cloud`
				: "https://toggle.hyphen.cloud";
		}

		return "https://toggle.hyphen.cloud";
	}

	/**
	 * Gets the default Horizon URLs for load balancing and failover.
	 *
	 * If a public key is provided, returns an array with the organization-specific
	 * URL as primary and the default Hyphen URL as fallback. Without a public key,
	 * returns only the default Hyphen URL.
	 *
	 * @param publicKey - Optional public API key to derive organization-specific URL
	 * @returns Array of Horizon URLs for load balancing
	 *
	 * @example
	 * ```typescript
	 * const toggle = new Toggle();
	 *
	 * // Without public key - returns default only
	 * const defaultUrls = toggle.getDefaultHorizonUrls();
	 * // ['https://toggle.hyphen.cloud']
	 *
	 * // With public key - returns org-specific + fallback
	 * const urls = toggle.getDefaultHorizonUrls('public_dGVzdC1vcmc6c2VjcmV0');
	 * // ['https://test-org.toggle.hyphen.cloud', 'https://toggle.hyphen.cloud']
	 * ```
	 */
	public getDefaultHorizonUrls(publicKey?: string): string[] {
		let result = [this.getDefaultHorizonUrl()];
		if (publicKey) {
			const defaultUrl = result[0];
			const orgUrl = this.getDefaultHorizonUrl(publicKey);
			result = [];
			if (orgUrl !== defaultUrl) {
				result.push(orgUrl);
			}
			// make the default url the secondary
			result.push(defaultUrl);
		}
		return result;
	}

	/**
	 * Generates a unique targeting key based on available context.
	 *
	 * @returns A targeting key in the format: `[app]-[env]-[random]` or simplified versions
	 */
	public generateTargetKey(): string {
		const randomSuffix = Math.random().toString(36).substring(7);
		const app = this._applicationId || "";
		const env = this._environment || "";

		// Build key components in order of preference
		const components = [app, env, randomSuffix].filter(Boolean);

		return components.join("-");
	}

	/**
	 * Extracts targeting key from a toggle context with fallback logic.
	 *
	 * @param context - The toggle context to extract targeting key from
	 * @returns The targeting key string
	 */
	private getTargetingKey(context: ToggleContext): string {
		if (context.targetingKey) {
			return context.targetingKey;
		}
		if (context.user) {
			return context.user.id;
		}
		// TODO: what is a better way to do this? Should we also have a service property so we don't add the random value?
		return this._defaultTargetingKey;
	}
}
