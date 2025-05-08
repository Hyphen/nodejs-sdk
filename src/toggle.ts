
export type ToggleOptions = {
	auth?: string;
};

export class Toggle {
	_options: ToggleOptions = {};
	constructor(options?: ToggleOptions) {
		this._options = options ?? {};
	}

	public get options(): ToggleOptions {
		return this._options;
	}

	public set options(options: ToggleOptions) {
		this._options = options;
	}
}
