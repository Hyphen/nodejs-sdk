import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import {config} from 'dotenv';

export type LoadEnvOptions = {
	currentWorkingDirectory?: string;
	environment?: string;
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
	// Set the current working directory if provided
	const currentWorkingDirectory = options?.currentWorkingDirectory ?? process.cwd();

	// Load the default .env file
	const envPath = path.resolve(currentWorkingDirectory, '.env');
	if (fs.existsSync(envPath)) {
		config({path: envPath});
	}

	// Load the environment specific .env file
	const environment = options?.environment ?? process.env.NODE_ENV;

	if (environment) {
		const envSpecificPath = path.resolve(currentWorkingDirectory, `.env.${environment}`);
		if (fs.existsSync(envSpecificPath)) {
			console.log(`Loading environment variables from: ${envSpecificPath}`);
			config({path: envSpecificPath, override: true});
		}
	}
}
