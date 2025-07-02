import {Hookified, type HookifiedOptions} from 'hookified';

export type HyphenOptions = {
	publicApiKey?: string;
	apiKey?: string;
} & HookifiedOptions;

export class Hyphen extends Hookified {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(options?: HyphenOptions) {
		super(options);
	}
}
