import { Hookified, type HookifiedOptions } from "hookified";
import { Link, type LinkOptions } from "./link.js";
import { NetInfo, type NetInfoOptions } from "./net-info.js";
import { Toggle, type ToggleOptions } from "./toggle.js";

export type HyphenOptions = {
	/**
	 * The public API key to use for the Hyphen service.
	 * This is used for public endpoints that do not require authentication.
	 */
	publicApiKey?: string;
	/**
	 * The API key to use for the Hyphen service.
	 * This is used for authenticated endpoints that require an API key.
	 */
	apiKey?: string;
	/**
	 * Whether to throw errors or not.
	 * If set to true, errors will be thrown instead of logged.
	 * @default false
	 */
	throwErrors?: boolean;
	/**
	 * Options for the Toggle service.
	 * Excludes publicApiKey and throwErrors from ToggleOptions.
	 * @see ToggleOptions
	 * @default {Toggle}
	 */
	toggle?: Omit<ToggleOptions, "publicApiKey" | "throwErrors">;
	/**
	 * Options for the NetInfo service.
	 * Excludes apiKey and throwErrors from NetInfoOptions.
	 * @see NetInfoOptions
	 * @default {NetInfo}
	 */
	netInfo?: Omit<NetInfoOptions, "apiKey" | "throwErrors">;
	/**
	 * Options for the Link service.
	 * Excludes apiKey and throwErrors from LinkOptions.
	 * @see LinkOptions
	 * @default {Link}
	 */
	link?: Omit<LinkOptions, "apiKey" | "throwErrors">;
} & HookifiedOptions;

export class Hyphen extends Hookified {
	private readonly _netInfo: NetInfo;
	private readonly _toggle: Toggle;
	private readonly _link: Link;

	private _publicApiKey?: string;
	private _apiKey?: string;

	constructor(options?: HyphenOptions) {
		super(options);

		const toggleOptions: ToggleOptions = options?.toggle ?? {};
		const netInfoOptions: NetInfoOptions = options?.netInfo ?? {};
		const linkOptions: LinkOptions = options?.link ?? {};

		if (options?.publicApiKey) {
			this._publicApiKey = options.publicApiKey;
			toggleOptions.publicApiKey = options.publicApiKey;
		}

		if (options?.apiKey) {
			this._apiKey = options.apiKey;
			netInfoOptions.apiKey = options.apiKey;
			linkOptions.apiKey = options.apiKey;
		}

		if (options?.throwErrors !== undefined) {
			toggleOptions.throwErrors = options.throwErrors;
			netInfoOptions.throwErrors = options.throwErrors;
			linkOptions.throwErrors = options.throwErrors;
		}

		this._netInfo = new NetInfo(netInfoOptions);
		// Set error, info, warn emitters for netInfo
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on("error", (message, ...args) =>
			this.emit("error", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on("info", (message, ...args) =>
			this.emit("info", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on("warn", (message, ...args) =>
			this.emit("warn", message, ...args),
		);

		this._toggle = new Toggle(toggleOptions);
		// Set error, info, warn emitters for toggle
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on("error", (message, ...args) =>
			this.emit("error", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on("info", (message, ...args) =>
			this.emit("info", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on("warn", (message, ...args) =>
			this.emit("warn", message, ...args),
		);

		this._link = new Link(linkOptions);
		// Set error, info, warn emitters for link
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._link.on("error", (message, ...args) =>
			this.emit("error", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._link.on("info", (message, ...args) =>
			this.emit("info", message, ...args),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._link.on("warn", (message, ...args) =>
			this.emit("warn", message, ...args),
		);
	}

	/**
	 * Get the NetInfo service instance.
	 * @returns {NetInfo} The NetInfo service instance.
	 */
	public get netInfo(): NetInfo {
		return this._netInfo;
	}

	/**
	 * Get the Toggle service instance.
	 * @returns {Toggle} The Toggle service instance.
	 */
	public get toggle(): Toggle {
		return this._toggle;
	}

	/**
	 * Get the Link service instance.
	 * @returns {Link} The Link service instance.
	 */
	public get link(): Link {
		return this._link;
	}

	/**
	 * Get the public API key for the Hyphen service.
	 * This is used for public endpoints that do not require authentication.
	 * @returns {string | undefined} The public API key.
	 */
	public get publicApiKey(): string | undefined {
		return this._publicApiKey;
	}

	/**
	 * Set the public API key for the Hyphen service. If set, this will also update the underlying services.
	 * This is used for public endpoints that do not require authentication such as the Toggle service.
	 * @param {string | undefined} value - The public API key to set.
	 */
	public set publicApiKey(value: string | undefined) {
		this._publicApiKey = value;
		this._toggle.publicApiKey = value;
	}

	/**
	 * Get the API key for the Hyphen service.
	 * This is used for authenticated endpoints that require an API key such as the NetInfo and Link services.
	 * @returns {string | undefined} The API key.
	 */
	public get apiKey(): string | undefined {
		return this._apiKey;
	}

	/**
	 * Set the API key for the Hyphen service. If set, this will also update the underlying services.
	 * This is used for authenticated endpoints that require an API key such as the NetInfo and Link services.
	 * @param {string | undefined} value - The API key to set.
	 */
	public set apiKey(value: string | undefined) {
		this._apiKey = value;
		this._netInfo.apiKey = value;
		this._link.apiKey = value;
	}

	/**
	 * Get whether to throw errors or not.
	 * If set to true, errors will be thrown instead of logged.
	 * @returns {boolean} Whether to throw errors or not.
	 */
	public get throwErrors(): boolean {
		return (
			this._netInfo.throwErrors &&
			this._toggle.throwErrors &&
			this._link.throwErrors
		);
	}

	/**
	 * Set whether to throw errors or not. If set to true, errors will be thrown instead of logged.
	 * This will update the underlying services as well.
	 * @param {boolean} value - Whether to throw errors or not.
	 */
	public set throwErrors(value: boolean) {
		this._netInfo.throwErrors = value;
		this._toggle.throwErrors = value;
		this._link.throwErrors = value;
	}
}
