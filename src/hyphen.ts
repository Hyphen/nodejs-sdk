import {Hookified, type HookifiedOptions} from 'hookified';
import {NetInfo} from './net-info.js';
import {Toggle} from './toggle.js';

export type HyphenOptions = {
	publicApiKey?: string;
	apiKey?: string;
	throwErrors?: boolean;
} & HookifiedOptions;

export class Hyphen extends Hookified {
	private readonly _netInfo: NetInfo;
	private readonly _toggle: Toggle;

	constructor(options?: HyphenOptions) {
		super(options);
		this._netInfo = new NetInfo(options);
		this._toggle = new Toggle(options);
	}

	public get netInfo(): NetInfo {
		return this._netInfo;
	}

	public get toggle(): Toggle {
		return this._toggle;
	}
}
