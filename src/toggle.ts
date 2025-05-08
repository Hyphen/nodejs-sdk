import process from 'node:process';
import {Hookified} from 'hookified';
import {OpenFeature} from '@openfeature/server-sdk';
import {HyphenProvider, type HyphenProviderOptions} from '@hyphen/openfeature-server-provider';

export type ToggleOptions = {
	/**
	 * Your application name
	 * @type {string}
	 */
	application: string;
	/**
	 * Your environment name such as development, production. Default is what is set at NODE_ENV
	 * @type {string}
	 * @example production
	 */
	environment?: string;
};

export class Toggle extends Hookified {
	private _application: string;
	private _environment: string;
	constructor(options: ToggleOptions) {
		super();

		this._application = options.application;
		this._environment = options.environment ?? process.env.NODE_ENV ?? 'development';
	}

	public get application(): string {
		return this._application;
	}

	public set application(value: string) {
		this._application = value;
	}

	public get environment(): string {
		return this._environment;
	}

	public set environment(value: string) {
		this._environment = value;
	}
}
