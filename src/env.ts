import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import {config} from 'dotenv';

export type LoadEnvOptions = {
	path?: string;
	environment?: string;
	local?: boolean;
};

/**
 * @description Helper function to load your environment variables based on your default .env file
 * and the current environment.
 * @param {LoadEnvOptions} [options] - Options to customize the loading of environment variables.
 * @returns {void}
 * @example
 * import { loadEnv } from '@hyphen/sdk';
 * loadEnv();
 */
export function loadEnv(options?: LoadEnvOptions): void {
	const local = options?.local ?? true;

	// Set the current working directory if provided
	const currentWorkingDirectory = options?.path ?? process.cwd();

	// Load the default .env file
	const envPath = path.resolve(currentWorkingDirectory, '.env');
	if (fs.existsSync(envPath)) {
		config({path: envPath});
	}

	// Load the .env.local file if it exists
	if (local) {
		const localEnvPath = path.resolve(currentWorkingDirectory, '.env.local');
		if (fs.existsSync(localEnvPath)) {
			config({path: localEnvPath, override: true});
		}
	}

	// Load the environment specific .env file
	const environment = options?.environment ?? process.env.NODE_ENV;

	if (environment) {
		const envSpecificPath = path.resolve(currentWorkingDirectory, `.env.${environment}`);
		if (fs.existsSync(envSpecificPath)) {
			config({path: envSpecificPath, override: true});
		}

		// Load the environment specific .env.local file if it exists
		if (local) {
			const envLocalPath = path.resolve(currentWorkingDirectory, `.env.${environment}.local`);
			if (fs.existsSync(envLocalPath)) {
				config({path: envLocalPath, override: true});
			}
		}
	}
}
