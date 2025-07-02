import {Hookified, type HookifiedOptions} from 'hookified';
import {NetInfo, type NetInfoOptions} from './net-info.js';
import {Toggle, type ToggleOptions} from './toggle.js';

export type HyphenOptions = {
	publicApiKey?: string;
	apiKey?: string;
	throwErrors?: boolean;
	toggle?: Omit<ToggleOptions, 'apiKey' | 'publicApiKey' | 'throwErrors'>; // Exclude apiKey and publicApiKey from ToggleOptions
	netInfo?: Omit<NetInfoOptions, 'apiKey' | 'publicApiKey' | 'throwErrors'>; // Exclude apiKey and publicApiKey from NetInfoOptions
} & HookifiedOptions;

export class Hyphen extends Hookified {
	private readonly _netInfo: NetInfo;
	private readonly _toggle: Toggle;

	private _publicApiKey?: string;
	private _apiKey?: string;

	constructor(options?: HyphenOptions) {
		super(options);

		const toggleOptions: ToggleOptions = options?.toggle ?? {};
		const netInfoOptions: NetInfoOptions = options?.netInfo ?? {};

		if (options?.publicApiKey) {
			this._publicApiKey = options.publicApiKey;
			toggleOptions.publicApiKey = options.publicApiKey;
		}

		if (options?.apiKey) {
			this._apiKey = options.apiKey;
			netInfoOptions.apiKey = options.apiKey;
		}

		if (options?.throwErrors !== undefined) {
			toggleOptions.throwErrors = options.throwErrors;
			netInfoOptions.throwErrors = options.throwErrors;
		}

		this._netInfo = new NetInfo(netInfoOptions);
		// Set error, info, warn emitters for netInfo
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on('error', (message, ...args) => this.emit('error', message, ...args));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on('info', (message, ...args) => this.emit('info', message, ...args));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._netInfo.on('warn', (message, ...args) => this.emit('warn', message, ...args));

		this._toggle = new Toggle(toggleOptions);
		// Set error, info, warn emitters for toggle
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on('error', (message, ...args) => this.emit('error', message, ...args));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on('info', (message, ...args) => this.emit('info', message, ...args));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this._toggle.on('warn', (message, ...args) => this.emit('warn', message, ...args));
	}

	public get netInfo(): NetInfo {
		return this._netInfo;
	}

	public get toggle(): Toggle {
		return this._toggle;
	}

	public get publicApiKey(): string | undefined {
		return this._publicApiKey;
	}

	public set publicApiKey(value: string | undefined) {
		this._publicApiKey = value;
		this._toggle.publicApiKey = value;
	}

	public get apiKey(): string | undefined {
		return this._apiKey;
	}

	public set apiKey(value: string | undefined) {
		this._apiKey = value;
		this._netInfo.apiKey = value;
	}

	public get throwErrors(): boolean {
		return this._netInfo.throwErrors && this._toggle.throwErrors;
	}

	public set throwErrors(value: boolean) {
		this._netInfo.throwErrors = value;
		this._toggle.throwErrors = value;
	}
}
